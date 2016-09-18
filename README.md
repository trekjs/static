# static

Serve static files for Trek.js.

## Installation

```
$ npm install trek-static --save
```

## Examples

```js
const path = require('path')
const Engine = require('trek-engine')
const Serve = require('trek-static')

const app = new Engine()

app.use(serve.static({
  relativePath: '/web',
  stripSlashes: 1,
  root: path.resolve(__dirname, '..')
}))

app.use(({ res }) => {
  res.send(200, 'Serve static files!')
})

app.run(3000)
```

## APIs

* `static(options)`

* `list(options)`

* `options`

  - `generateIndexPages` is true and will auto generate index pages.
    > The index pages' design from [micro-list](https://github.com/zeit/micro-list).



## Badges

[![Build Status](https://travis-ci.org/trekjs/static.svg?branch=master)](https://travis-ci.org/trekjs/static)
[![codecov](https://codecov.io/gh/trekjs/static/branch/master/graph/badge.svg)](https://codecov.io/gh/trekjs/static)
![](https://img.shields.io/badge/license-MIT-blue.svg)

---

> [fundon.me](https://fundon.me) &nbsp;&middot;&nbsp;
> GitHub [@fundon](https://github.com/fundon) &nbsp;&middot;&nbsp;
> Twitter [@_fundon](https://twitter.com/_fundon)
