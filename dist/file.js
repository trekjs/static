'use strict'

const { createReadStream } = require('fs')
const { parse } = require('path')
const { lookup } = require('mime-types')
const filesize = require('filesize')
const { readdir, readFile, stat } = require('./util')

module.exports = class File {

  constructor (path) {
    this.path = path
  }

  parse () {
    return Object.assign(this, parse(this.path))
  }

  stat () {return __async(function*(){
    const stats = yield stat(this.path)
    return Object.assign(this, stats, Reflect.getPrototypeOf(stats))
  }.call(this))}

  read () {return __async(function*(){
    this.buffer = yield readFile(this.path)
    return this
  }.call(this))}

  readdir () {return __async(function*(){
    return yield readdir(this.path)
  }.call(this))}

  stream (options) {
    return createReadStream(this.path, options)
  }

  filesize (options = { round: 0 }) {
    return filesize(this.size, options)
  }

  get type () {
    return lookup(this.path) || 'application/octet-stream'
  }

}

function __async(g){return new Promise(function(s,j){function c(a,x){try{var r=g[x?"throw":"next"](a)}catch(e){return j(e)}return r.done?s(r.value):Promise.resolve(r.value).then(c,d)}function d(e){return c(e,1)}c()})}
