import fs from 'fs'
import path from 'path'
import test from 'ava'
import Engine from 'trek-engine'
import request from 'request-promise'
import listen from './helpers/listen'
import { favicon } from '..'

test('should respond favicon.icon', async t => {
  const app = new Engine()
  const icon = path.join(__dirname, '../examples/favicon.ico')

  app.use(await favicon(icon))

  const url = await listen(app)
  const res = await request({ url })
  t.deepEqual(res, fs.readFileSync(icon, 'utf-8'))
})
