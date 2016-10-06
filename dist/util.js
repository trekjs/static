'use strict'

const fs = require('fs')
const { resolve } = require('path')

const promisify = fn => path => new Promise((resolve, reject) => fn(path, (err, res) => err ? reject(err) : resolve(res)))
const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const stat = promisify(fs.stat)

const stripLeadingSlashes = (path, stripSlashes) => {
  while (stripSlashes && path.length) {
    if (path.charCodeAt(0) !== 47) {
      throw new Error('BUG: path must start with slash')
    }
    const n = path.substring(1).indexOf('/')
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
  while ((index = path.length - 1) && path.charCodeAt(index) === 47) {
    path = path.substring(0, index)
  }
  return path
}

const newPathSlashesStripper = slashesCount => req => stripLeadingSlashes(req.path, slashesCount)

const isRangeFresh = (req, res) => {
  const ifRange = req.get('if-range')

  if (!ifRange) {
    return true
  }

  return ~ifRange.indexOf('"')
    ? ~ifRange.indexOf(res.get('etag'))
    : Date.parse(res.get('last-modified')) <= Date.parse(ifRange)
}

/**
 * Create a Content-Range header.
 *
 * @param {string} type
 * @param {number} size
 * @param {array} [range]
 */

function contentRange (type, size, range) {
  return type + ' ' + (range ? range.start + '-' + range.end : '*') + '/' + size
}

const render = (view, state) => {
  view = view || resolve(__dirname, '..', 'views', 'index.marko')
  return require('marko').load(view).stream(state) // lazy require marko
}

module.exports = {

  promisify,

  readdir,

  readFile,

  stat,

  stripLeadingSlashes,

  stripTrailingSlashes,

  newPathSlashesStripper,

  isRangeFresh,

  contentRange,

  render

}
