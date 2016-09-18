'use strict'

const FS = require('./fs')

module.exports = {

  // Serve files by root
  static (options) {
    const fs = new FS(options)
    return fs.handler()
  },

  // A single file
  file () {},

  // Serves static files and generates and index page withc list all files.
  list (options) {
    const fs = new FS(options)
    fs.options.generateIndexPages = true
    return fs.handler()
  }
}
