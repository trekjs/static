import test from 'ava'
import Engine from 'trek-engine'
import request from 'request-promise'
import listen from './helpers/listen'
import { content } from '..'

test('test', async t => {
  const app = new Engine()
  const pkg = { hello: 'trek-static' }

  app.use(content('json', pkg))

  const url = await listen(app)
  const res = await request({ url, json: true })
  t.deepEqual(res, pkg)
})
