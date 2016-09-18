'use strict'

const fs = require('fs')
const zlib = require('zlib')
const crypto = require('crypto')
const path = require('path')
const compressible = require('compressible')
const onFinished = require('on-finished')
const destroy = require('destroy')

const {
  stripTrailingSlashes,
  newPathSlashesStripper,
  filesize,
  fsStat,
  fsReaddir,
  render,
  mime
} = require('./util')

const FS_DEFAULTS = {
  // Relative path for request
  relativePath: '/',
  // StripSlashes indicates how many leading slashes must be stripped
  // from requested path before searching requested file in the root folder
  stripSlashes: 0,
  // Path to the root directory to serve files from.
  root: '',
  // List of index file names to try opening during directory access.
  indexNames: [],
  // Index pages for directories without files matching IndexNames are automatically generated if set.
  generateIndexPages: true,
  // Transparently compresses responses if set to true.
  compress: true,
  compressOptions: undefined,
  minCompressSize: 1024,
  // Enables byte range requests if set to true.
  acceptByteRange: true,
  // Path rewriting function.
  pathRewrite: undefined,
  // Expiration duration for inactive file handlers.
  cacheDuration: 0,
  // Suffix to add to the name of cached compressed file.
  compressedFileSuffix: '',
  // Ignore files
  ignoredFiles: ['.DS_Store', '.git/'],
  // Optional cache control header. Overrides options.maxAge.
  cacheControl: '',
  // Cache control max age (ms) for the files, defaults to 8.76 hours.
  maxAge: 60 * 60 * 1000 * 8.76
}

class FS {

  constructor (options) {
    this.options = Object.assign({}, FS_DEFAULTS, options)

    if (this.options.stripSlashes)  {
      this.options.pathRewrite = newPathSlashesStripper(this.options.stripSlashes)
    }

  }

  get root () {
    return this.options.root
  }

  get indexNames () {
    return this.options.indexNames
  }

  handler () {
    let root = this.root
    if (0 === root.length) {
      root = '.'
    }

    root = stripTrailingSlashes(root)

    const h = new FSHandler(Object.assign({}, this.options, { root }))
    this.h = h.handle.bind(h)
    return this.h
  }

}

class FSHandler {

  static create (root, stripSlashes = 0) {
    const fs = new FS({
      root,
      indexNames: ['index.html'],
      generateIndexPages: true,
      acceptByteRange: true
    })

    return fs.handler
  }

  constructor (options) {
    this.options = Object.assign({}, FS_DEFAULTS, options)
  }

  handle ({ req, res, rawRes }, next) {return __async(function*(){
    // only accept HEAD and GET
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()

    let {
      pathRewrite,
      root,
      relativePath,
      compress,
      compressOptions,
      minCompressSize,
      cacheControl,
      maxAge
    } = this.options
    const pathname = stripTrailingSlashes(pathRewrite ? pathRewrite(req) : req.path)
    const filePath = root + pathname

    const stats = yield fsStat(filePath)

    let file
    if (stats.isFile()) {
      file = this.openFile(filePath, stats)
    } else if (stats.isDirectory()) {
      file = yield this.openIndexFile(filePath, pathname)
    }

    if (file) {
      const { stats } = file

      if (stats) {
        res.lastModified = stats.mtime
      } else {
        cacheControl = 'no-cache'
      }

      res.set('cache-control', cacheControl || `public, max-age=${maxAge}`)
      res.set('content-type', file.type)

      if (req.fresh) {
        res.status = 304
        return res.end()
      }

      let stream = file.stream || fs.createReadStream(filePath)
      const ss = [stream]

      if (compress && req.acceptsEncodings('gzip') === 'gzip'
        && compressible(file.type)) {
        res.set('content-encoding', 'gzip')
        ss.push(zlib.createGzip(compressOptions))
      } else if (stats) {
        res.set('content-length', stats.size)
      }

      stream = ss.reduce((prev, curr) => prev.pipe(curr))
      stream.pipe(rawRes)
      onFinished(rawRes, () => destroy(stream))
    }
  }.call(this))}

  openFile (filePath, stats, stream) {
    const file = new File(filePath, stats, this)
    file.type = mime.contentType(path.extname(filePath)) || 'application/octet-stream'
    file.stream = stream
    return file
  }

  openIndexFile (dirPath, pathname) {return __async(function*(){
    for (const indexName of this.options.indexNames) {
      const indexFilePath = path.join(dirPath, indexName)
      try {
        const stats = yield fsStat(indexFilePath)
        if (stats.isFile()) {
          return this.openFile(indexFilePath, stats)
        }
      } catch (err) {
        throw new Error(`cannot open file ${indexFilePath} ${err}`)
      }
    }

    if (!this.options.generateIndexPages) {
      throw new Error(`cannot access directory without index page. Directory ${dirPath}`)
    }

    return this.createDirIndex(dirPath, pathname)
  }.call(this))}

  createDirIndex (directory, pathname) {return __async(function*(){
    const { relativePath, ignoredFiles } = this.options
    let files = yield fsReaddir(directory)
    files = yield Promise.all(files.map((filePath, i) => __async(function*(){
      filePath = path.resolve(directory, filePath)
      const details = path.parse(filePath)
      details.ext = details.ext.split('.')[1]
      details.relative = path.join(relativePath, pathname, details.base)

      const stats = yield fsStat(filePath)
      if (stats.isDirectory()) {
        details.base += '/'
      } else {
        details.size = filesize(stats.size, { round: 0 })
      }

      if (ignoredFiles.indexOf(details.base) > -1) {
        return null
      }
      return details
    }())))

    files = files.filter(f => f)

    const paths = pathname === '/' ? [''] : pathname.split('/')

    paths.reduce((prev, curr, i) => {
      const url = prev + '/' + curr
      paths[i] = {
        name: paths[i],
        url
      }
      return path.resolve(url + '/')
    }, relativePath)

    // return a file
    return this.openFile(
      directory + '/index.html',
      undefined,
      // render template as stream
      render(void 0, {
        directory,
        paths,
        files,
        nodeVersion: process.version
      })
    )
  }.call(this))}

}

class File {

  constructor (filePath, stats, handler) {
    this.filePath = filePath
    this.stats = stats
    this.handler = handler
  }

}

module.exports = {

  FS,

  FSHandler,

  File

}

function __async(g){return new Promise(function(s,j){function c(a,x){try{var r=g[x?"throw":"next"](a)}catch(e){return j(e)}return r.done?s(r.value):Promise.resolve(r.value).then(c,d)}function d(e){return c(e,1)}c()})}
