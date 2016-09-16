'use strict'

const { FS } = require('./fs')

module.exports = {

  // Serve files by root
  static (options) {
    const fs = new FS(options)
    const { relativePath } = fs.options

    fs.handler()

    return (ctx, next) => {

      if (ctx.req.path.startsWith(relativePath)) {
        return fs.h(ctx, next)
      }

      return next()
    }
  },

  // A single file
  file () {}
}
