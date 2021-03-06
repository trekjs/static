'use strict'

const fs = require('fs')
const { normalize, join } = require('path')
const Engine = require('trek-engine')
const serveStatic = require('..')

const root = normalize(__dirname)

async function start (port = 3000) {
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

  app.on('error', console.error)

  await app.run(port)
  console.log(`Open: http://127.0.0.1:${port}`)
}

start().catch(console.error)
