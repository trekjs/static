'use strict'

const fs = require('fs')

const path = require('path')

const {
  stripTrailingSlashes,
  newPathSlashesStripper,
  filesize,
  fsStat,
  fsReaddir,
  render,
  mime
} = require('./util')

const VIEW = path.resolve(__dirname, '..', 'views', 'index.marko')

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
  // Enables byte range requests if set to true.
  acceptByteRange: true,
  // Path rewriting function.
  pathRewrite: undefined,
  // Expiration duration for inactive file handlers.
  cacheDuration: 0,
  // Suffix to add to the name of cached compressed file.
  compressedFileSuffix: '',
  // Ignore files
  ignoredFiles: ['.DS_Store', '.git/']
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

  async handle ({ req, res, rawRes }, next) {
    // only accept HEAD and GET
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()

    const { pathRewrite, root, relativePath } = this.options
    const pathname = stripTrailingSlashes(pathRewrite ? pathRewrite(req) : req.path)
    const filePath = root + pathname

    try {
      const stats = await fsStat(filePath)

      let file
      if (stats.isFile()) {
        file = this.openFile(filePath, stats)
      } else if (stats.isDirectory()) {
        file = await this.openIndexFile(filePath, pathname)
      }

      if (file) {
        const stream = file.stream || fs.createReadStream(file.filePath)

        if (file.stats) {
          res.set('content-length', file.stats.size)
        }
        res.set('content-type', file.contentType)

        stream.pipe(rawRes)
      }
    } catch (err) {
      return next()
    }
  }

  openFile (filePath, stats) {
    const file = new File(filePath, stats, this)
    file.contentType = mime.contentType(path.extname(filePath)) || 'application/octet-stream'
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

      console.log(ignoredFiles.indexOf(details.base))
      if (ignoredFiles.indexOf(details.base) > -1) {
        return null
      }
      return details
    }))

    files = files.filter(f => f)

    const file = this.openFile(directory + '/index.html')

    const paths = pathname === '/' ? [''] : pathname.split('/')

    paths.reduce((prev, curr, i) => {
      const url = prev + '/' + curr
      paths[i] = {
        name: paths[i],
        url
      }
      return path.resolve(url + '/')
    }, relativePath)


    file.stream = render(VIEW, {
      directory,
      paths,
      files,
      nodeVersion: process.version
    })

    return file
  }

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
