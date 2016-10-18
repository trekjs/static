'use strict'

const { join } = require('path')
const zlib = require('zlib')
const LRU = require('lru-cache')
const destroy = require('destroy')
const onFinished = require('on-finished')
const compressible = require('compressible')
const parseRange = require('range-parser')
const defaults = require('./defaults')
const File = require('./file')
const {
  newPathSlashesStripper,
  stripTrailingSlashes,
  isRangeFresh,
  contentRange,
  render
} = require('./util')

/**
 * Regular expression for identifying a bytes Range header.
 */

const BYTES_RANGE_REGEXP = /^ *bytes=/

module.exports = class FS {

  constructor (options) {
    this.options = Object.assign({}, defaults, options)
  }

  get relativePath () {
    return this.options.relativePath
  }

  get indexNames () {
    return this.options.indexNames
  }

  get generateIndexPages () {
    return this.options.generateIndexPages
  }

  async getFileFromCache (filepath) {
    if (!this.cache) return await new File(filepath).stat()
    let file = this.cache.get(filepath)
    if (file) return file
    file = await new File(filepath).stat()
    if (file.isFile()) this.cache.set(filepath, file)
    return file
  }

  handler () {
    let { root, relativePath, stripSlashes, lruCacheOptions } = this.options

    if (stripSlashes) {
      this.options.pathRewrite = newPathSlashesStripper(stripSlashes)
    }

    if (0 === root.length) {
      root = '.'
    }

    if (relativePath.charCodeAt(relativePath.length - 1) !== 47) {
      this.options.relativePath += '/'
    }

    if (false !== lruCacheOptions) {
      this.cache = new LRU(lruCacheOptions)
    }

    this.options.root = stripTrailingSlashes(root)

    return this.handle.bind(this)
  }

  async handle ({ req, res, rawRes: raw }) {
    const {
      root,
      pathRewrite,
      compress,
      cacheControl,
      maxAge,
      acceptByteRange,
      expires,
      vary
    } = this.options
    const pathname = stripTrailingSlashes(pathRewrite ? pathRewrite(req) : req.path)
    const filepath = root + pathname

    let file = await this.getFileFromCache(filepath)

    if (file.isDirectory()) {
      file = await this.index(filepath, pathname)
    }

    if (!file.isFile()) {
      return res.send(405)
    }

    if (file.isCreated) {
      res.set('cache-control', 'no-cache')
    } else {
      res.set('cache-control', cacheControl || `max-age=${maxAge}, public`)
      res.set('content-type', file.type)
      res.set('expires', new Date(expires).toUTCString())
      res.vary(vary)
    }

    if (file.mtime <= new Date(req.get('if-modified-since')) || req.fresh) {
      return res.send(304)
    }

    let len = file.size
    // stream opts
    let opts

    if (acceptByteRange) {
      res.set('accept-ranges', 'bytes')
      let ranges = req.get('range')
      let offset = 0
      if (BYTES_RANGE_REGEXP.test(ranges)) {
        // parse
        ranges = parseRange(len, ranges, {
          combine: true
        })

        // If-Range support
        if (!isRangeFresh(req, res)) {
          ranges = -2
        }

        // unsatisfiable
        if (ranges === -1) {
          // Content-Range
          res.set('content-range', contentRange('bytes', len))

          // 416 Requested Range Not Satisfiable
          return res.send(416)
        }
      }

      // valid (syntactically invalid/multiple ranges are treated as a regular response)
      if (ranges !== -2 && ranges.length === 1) {
        // Content-Range
        res.status = 206
        res.set('content-range', contentRange('bytes', len, ranges[0]))

        // adjust for requested range
        offset += ranges[0].start
        len = ranges[0].end - ranges[0].start + 1
      }

      // set read options
      opts = {
        start: offset,
        end: Math.max(offset, offset + len - 1)
      }
    }

    let stream = file.stream(opts)
    const ss = [stream]

    if (compress &&
      req.acceptsEncodings('gzip') === 'gzip' &&
      compressible(file.type)) {
      res.set('content-encoding', 'gzip')
      ss.push(zlib.createGzip(compress))
    } else if (!file.isCreated) {
      // content-length
      res.set('Content-Length', len)
    }

    if (file.mtime) {
      res.lastModified = file.mtime
    }

    stream = ss.reduce((prev, curr) => prev.pipe(curr))
    onFinished(raw, () => destroy(stream))
    raw.responded = true
    raw.statusCode = 200
    stream.pipe(raw)
  }

  async index (dirpath, pathname) {
    for (const name of this.indexNames) {
      const filepath = join(dirpath, name)
      const file = new File(filepath)
      try {
        await file.stat() // eslint-disable-line babel/no-await-in-loop
        if (file.isFile()) return file
      } catch (err) {
        throw new Error(`cannot open file ${filepath} ${err}`)
      }
    }

    if (!this.generateIndexPages) {
      throw new Error(`cannot access directory without index page. Directory ${dirpath}`)
    }

    return await this.createIndex(dirpath, pathname)
  }

  async createIndex (directory, pathname) {
    const { relativePath, ignoredFiles } = this.options
    const dir = new File(directory)
    let files = await dir.readdir()

    files = await Promise.all(files.map(async filepath => {
      const file = new File(join(directory, filepath)).parse()

      if (ignoredFiles.indexOf(file.base) > -1) {
        return null
      }

      await file.stat()

      return {
        size: file.filesize(),
        relative: join(relativePath, pathname, file.base),
        base: file.isDirectory() ? file.base + '/' : file.base,
        exit: file.ext
      }
    }))

    files = files.filter(f => f)

    const paths = pathname === '/' ? [''] : pathname.split('/')

    paths.reduce((prev, curr, i) => {
      const url = prev + (i > 1 ? '/' : '') + curr
      paths[i] = {
        name: paths[i],
        url
      }
      return url
    }, relativePath)

    const file = new File(directory + '/index.html')
    file.isCreated = true
    file.isFile = () => true
    // render template as stream
    file.stream = () => render(undefined, {
      directory,
      paths,
      files,
      nodeVersion: process.version
    })

    return file
  }

}
