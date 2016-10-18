import fs from 'fs'
import path from 'path'
import test from 'ava'
import Engine from 'trek-engine'
import request from 'request-promise'
import listen from './helpers/listen'
import { web } from '..'

test('should generate index.html', async t => {
  const app = new Engine()
  const webPath = path.join(__dirname, '../')

  app.use(await web('/web/', webPath, 1))

  const url = (await listen(app)) + '/web/examples/'
  const res = await request({ url })
  t.not(res, fs.readFileSync(path.join(webPath, 'examples/index.html'), 'utf8'))
})

test('should respond exists index.html', async t => {
  const app = new Engine()
  const webPath = path.join(__dirname, '../examples')

  app.use(await web('/web/', webPath, 1))

  const url = (await listen(app)) + '/web/'
  const res = await request({ url })
  t.is(res, fs.readFileSync(path.join(webPath, 'index.html'), 'utf8'))
})
