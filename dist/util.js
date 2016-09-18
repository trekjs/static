'use strict'

const fs = require('fs')
const path = require('path')
const filesize = require('filesize')
const mime = require('mime-types')

const promisify = fn => path => new Promise((resolve, reject) => fn(path, (err, res) => err ? reject(err) : resolve(res)))

const fsStat = promisify(fs.stat)

const fsReaddir = promisify(fs.readdir)

const SLASH = '/'

const render = (view, state) => {
  view = view || path.resolve(__dirname, '..', 'views', 'index.marko')
  // lazy require marko
  return require('marko').load(view).stream(state)
}

const stripLeadingSlashes = (path, stripSlashes) => {
  while (stripSlashes && path.length) {
    if (path.charAt(0) !== SLASH) {
      throw new Error('BUG: path must start with slash')
    }
    const n = path.substring(1).indexOf(SLASH)
    if (n < 0) {
      path = ''
      break
    }

    path = path.substring(n + 1)
    stripSlashes--
  }
  return path
}

const stripTrailingSlashes = (path, index) => {
  while ((index = path.length - 1) && path.charAt(index) === SLASH) {
    path = path.substring(0, index)
  }
  return path
}

const newPathSlashesStripper = slashesCount => req => stripLeadingSlashes(req.path, slashesCount)

module.exports = {

  stripLeadingSlashes,

  stripTrailingSlashes,

  newPathSlashesStripper,

  filesize,

  promisify,

  fsStat,

  fsReaddir,

  render,

  mime

}
