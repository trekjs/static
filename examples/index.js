'use strict'

const path = require('path')
const TrekEngine = require('trek-engine')
const serve = require('..')

const app = new TrekEngine()

app.use(serve.list({
  //relativePath: '/web/static/',
  //stripSlashes: 2,
  relativePath: '/web',
  stripSlashes: 1,
  root: path.resolve(__dirname, '..'),
  // indexNames: ['index.html']
}))

app.use(({ res }) => {
  res.status = 404
  res.end()
})

app.run(3030)
