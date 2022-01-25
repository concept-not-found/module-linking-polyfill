import { toMatchTree } from '../matchers.js'
import trimWasm from '../trim-wasm.js'
import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import indexAdapterModule from './index.js'

expect.extend({ toMatchTree })

describe('index adapter module', () => {
  test('empty', () => {
    const wat = `
      (adapter module)
    `

    const parser = Parser()
    const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
    indexAdapterModule(adapterModule)

    expect(adapterModule).toMatchTree(['adapter', 'module'])
  })
})
