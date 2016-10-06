'use strict'

const { resolve, join } = require('path')
const etag = require('etag')
const defaults = require('./defaults')
const FS = require('./fs')
const File = require('./file')
const util = require('./util')

function create (options) {
  return new FS(options).handler()
}

/* eslint max-params: 0 */
function handler (relativePath, systemPath, stripSlashes, compress, generateIndexPages, indexNames = []) {
  return create({
    relativePath,
    root: systemPath,
    stripSlashes,
    compress,
    generateIndexPages,
    indexNames
  })
}

module.exports = {

  util,

  defaults,

  FS,

  File,

  create,

  handler,

  // Serves bytes, buffers, memory cached, on the `req.path`.
  content (type, body, options) {
    options = Object.assign({}, defaults, options)
    const mtime = new Date()
    mtime.setMilliseconds(0)

    const cacheControl = options.cacheControl || `max-age=${options.maxAge}, public`
    const expires = new Date(Date.now() + options.expires).toUTCString()
    const vary = options.vary
    const etagOpts = options.etag

    return function content ({ req, res }) {
      res.set('cache-control', cacheControl)
      res.set('expires', expires)
      res.vary(vary)

      if (mtime <= new Date(req.get('if-modified-since')) || req.fresh) {
        res.status = 304
        return res.end()
      }

      res.type = type
      res.lastModified = mtime
      if (Buffer.isBuffer(body) || 'string' === typeof body) res.etag = etag(body, etagOpts)
      res.send(200, body)
    }
  },

  // Serves static favicon, `favicon.ico` `favicon.png` etc.
  favicon (path, options) {return __async(function*(){
    path = resolve(path)
    options = Object.assign({}, defaults, options)

    const file = yield new File(path).stat()

    if (!file.isFile()) {
      throw new Error('Favicon should be a file')
    }

    yield file.parse().read()

    const { mtime, type, buffer } = file

    const cacheControl = options.cacheControl || `max-age=${options.maxAge}, public`
    const expires = new Date(Date.now() + options.expires).toUTCString()
    const vary = options.vary
    const etagOpts = options.etag

    return function favicon ({ req, res }) {
      res.set('cache-control', cacheControl)
      res.set('expires', expires)
      res.vary(vary)

      if (mtime <= new Date(req.get('if-modified-since')) || req.fresh) {
        res.status = 304
        return res.end()
      }

      res.type = type
      res.lastModified = mtime
      res.etag = etag(file, etagOpts)
      res.send(200, buffer)
    }
  }())},

  // Serves a system directory and generates an index page which list all files.
  // it will generate compressed files.
  fs (relativePath, systemPath, stripSlashes) {
    return handler(relativePath, systemPath, stripSlashes, true, true, undefined)
  },

  // Static registers a route which serves a system directory
  // this doesn't generates an index page which list all files
  // no compression is used also, for these features look at fs function.
  static (relativePath, systemPath, stripSlashes) {
    return handler(relativePath, systemPath, stripSlashes, false, false, undefined)
  },

  // Serves a directory as web resource
  // It uses gzip compression (compression on each request, no file cache)
  serve (relativePath, systemPath, stripSlashes) {return __async(function*(){
    relativePath = resolve(relativePath)
    systemPath = resolve(systemPath)

    const file = new File(systemPath)
    try {
      yield file.stat()
    } catch (err) {}
    const isDir = file.mode && file.isDirectory()
    if (!isDir) {
      throw new Error('Directory is required')
    }

    return handler(relativePath, systemPath, stripSlashes, true, false, undefined)
  }())},

  // Serves a system directory, if index.html exists and request uri
  // is `/` then display the index.html's contents, else not index.html exists then
  // generates an index page which list all files.
  // it will not generate compressed files.
  web (relativePath, systemPath, stripSlashes) {return __async(function*(){
    const indexNames = []
    const file = new File(join(systemPath, 'index.html'))
    try {
      yield file.stat()
    } catch (err) {}
    const hasIndex = file.mode && file.isFile()
    if (hasIndex) {
      indexNames.push('index.html')
    }
    return handler(relativePath, systemPath, stripSlashes, false, !hasIndex, indexNames)
  }())}

}

function __async(g){return new Promise(function(s,j){function c(a,x){try{var r=g[x?"throw":"next"](a)}catch(e){return j(e)}return r.done?s(r.value):Promise.resolve(r.value).then(c,d)}function d(e){return c(e,1)}c()})}
