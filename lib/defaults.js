'use strict'

// https://devcenter.heroku.com/articles/increasing-application-performance-with-http-cache-headers
// https://www.keycdn.com/blog/http-cache-headers/

module.exports = {
  // Relative path for request
  relativePath: '/',

  // Path to the root directory to serve files from.
  root: '',

  // StripSlashes indicates how many leading slashes must be stripped
  // from requested path before searching requested file in the root folder
  stripSlashes: 0,

  // List of index file names to try opening during directory access.
  indexNames: [],

  // Index pages for directories without files matching IndexNames are automatically generated if set.
  generateIndexPages: false,

  // Ignore files
  ignoredFiles: ['.DS_Store', '.git/'],

  // Path rewriting function.
  pathRewrite: undefined,

  // Enables byte range requests if set to true.
  acceptByteRange: true,

  // Transparently compresses responses if set to true.
  compress: true,

  // Cache control max age (ms) for the files, defaults to 8.76 hours = 31536000 ms.
  cacheControl: undefined,
  maxAge: 60 * 60 * 1000 * 8.76,

  // Expires: 358 days
  expires: (365 - 7) * 24 * 60 * 60 * 1000,

  // Manipulate the HTTP Vary header
  vary: 'accept-encoding',

  // Etag options
  etag: { weak: true },

  // Lru-cache options, pass to lru-cache lib
  lruCacheOptions: 100
}
