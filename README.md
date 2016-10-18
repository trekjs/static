# static

Serve static files middleware.


## Installation

```
$ npm install trek-static --save
```


## Examples

```js
'use strict'

const fs = require('fs')
const { normalize, join } = require('path')
const Engine = require('trek-engine')
const serveStatic = require('..')

const root = normalize(__dirname)

async function start () {
  const app = new Engine()

  const faviconHandle = await serveStatic.favicon(join(root, 'favicon.ico'))
  const indexHandle = serveStatic.content('text/html', fs.readFileSync(join(root, 'index.html')))
  const serveHandle = await serveStatic.serve('/ls/', root, 1)
  const webHandle = await serveStatic.web('/web/', join(root, '..'), 1)
  const fsHandle = serveStatic.fs('/fs/', join(root, '..'), 1)
  const staticHandle = serveStatic.static('/static/', join(root, '..'), 1)

  app.use(async (ctx, next) => {
    const { req, res } = ctx
    const requestPath = req.path

    let handle
    if (requestPath === '/') {
      handle = indexHandle
    } else if (requestPath === '/favicon.ico') {
      handle = faviconHandle
    } else if (requestPath.startsWith('/ls/')) {
      handle = serveHandle
    } else if (requestPath.startsWith('/web/')) {
      handle = webHandle
    } else if (requestPath.startsWith('/fs/')) {
      handle = fsHandle
    } else if (requestPath.startsWith('/static/')) {
      handle = staticHandle
    }

    if (handle) await handle(ctx, next)
    else res.send(404)

  })

  app.on('error', (err, ctx) => {
    console.log(err)
  })

  app.run(3000)
}

start().catch(console.error)
```


## API

* `content (type, body, options)`

  Serves bytes, buffers, memory cached, on the `req.path`.

* `async favicon (path, options)`

  Serves static favicon, `favicon.ico` `favicon.png` etc.

* `fs (relativePath, systemPath, stripSlashes)`

  Serves a system directory and generates an index page which list all files.  
  It will generate compressed files.

* `static (relativePath, systemPath, stripSlashes)`

  Static registers a route which serves a system directory  
  this doesn't generates an index page which list all files  
  no compression is used also, for these features look at fs function.

* `async serve (relativePath, systemPath, stripSlashes)`

  Serves a directory as web resource  
  It uses gzip compression (compression on each request, no file cache).

* `async web (relativePath, systemPath, stripSlashes)`

  Serves a system directory, if index.html exists and request uri  
  is `/` then display the index.html's contents, else not index.html exists then  
  generates an index page which list all files.  
  it will not generate compressed files.

* `options`

  ```js
  {
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
    expires:  (365 - 7) * 24 * 60 * 60 * 1000,

    // Manipulate the HTTP Vary header
    vary: 'accept-encoding',

    // Etag options
    etag: { weak: true }
  }
  ```


## Badges

[![Build Status](https://travis-ci.org/trekjs/static.svg?branch=master)](https://travis-ci.org/trekjs/static)
[![codecov](https://codecov.io/gh/trekjs/static/branch/master/graph/badge.svg)](https://codecov.io/gh/trekjs/static)
![](https://img.shields.io/badge/license-MIT-blue.svg)

---

> [fundon.me](https://fundon.me) &nbsp;&middot;&nbsp;
> GitHub [@fundon](https://github.com/fundon) &nbsp;&middot;&nbsp;
> Twitter [@_fundon](https://twitter.com/_fundon)
