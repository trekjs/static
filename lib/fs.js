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

const defaults = {
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
  generateIndexPages: false,
  // Transparently compresses responses if set to true.
  compress: true,
  compressOptions: undefined,
  compressMinSize: 1024,
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
    this.options = Object.assign({}, defaults, options)
  }

  get relativePath () {
    return this.options.relativePath
  }

  handler () {
    let { root, stripSlashes } = this.options

    if (stripSlashes)  {
      this.options.pathRewrite = newPathSlashesStripper(stripSlashes)
    }

    if (!root.length) {
      root = '.'
    }

    this.options.root = stripTrailingSlashes(root)

    return this.handle.bind(this)
  }

  async handle ({ req, res, rawRes }, next) {
    // only accept HEAD and GET
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    if (!req.path.startsWith(this.relativePath)) return next()

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
    let stats
    let file

    try {
      stats = await fsStat(filePath)
      if (stats.isFile()) {
        file = this.openFile(filePath, stats)
      } else if (stats.isDirectory()) {
        file = await this.openIndexFile(filePath, pathname)
      }
    } catch (err) {
      return res.send(404, err.message)
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
  }

  openFile (filePath, stats, stream) {
    const file = new File(filePath, stats, this)
    file.type = mime.contentType(path.extname(filePath)) || 'application/octet-stream'
    file.stream = stream
    return file
  }

  async openIndexFile (dirPath, pathname) {
    for (const indexName of this.options.indexNames) {
      const indexFilePath = path.join(dirPath, indexName)
      try {
        const stats = await fsStat(indexFilePath)
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
  }

  async createDirIndex (directory, pathname) {
    const { relativePath, ignoredFiles } = this.options
    let files = await fsReaddir(directory)
    files = await Promise.all(files.map(async (filePath, i) => {
      filePath = path.resolve(directory, filePath)
      const details = path.parse(filePath)
      details.ext = details.ext.split('.')[1]
      details.relative = path.join(relativePath, pathname, details.base)

      const stats = await fsStat(filePath)
      if (stats.isDirectory()) {
        details.base += '/'
      } else {
        details.size = filesize(stats.size, { round: 0 })
      }

      if (ignoredFiles.indexOf(details.base) > -1) {
        return null
      }
      return details
    }))

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
  }
}

class File {

  constructor (filePath, stats, handler) {
    this.filePath = filePath
    this.stats = stats
    this.handler = handler
  }

}

exports = module.exports = FS

exports.File = File
