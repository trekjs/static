'use strict'

const { createReadStream } = require('fs')
const { parse, resolve } = require('path')
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

  async stat () {
    const stats = await stat(this.path)
    return Object.assign(this, stats, Reflect.getPrototypeOf(stats))
  }

  async read () {
    this.buffer = await readFile(this.path)
    return this
  }

  async readdir () {
    return await readdir(this.path)
  }

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
