import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import indexAdapterModule from './index.js'
import parseModule from './grammar.js'

describe('index adapter module', () => {
  test('empty', () => {
    const wat = `
      (adapter module)
    `

    const parser = Parser()
    const adapterModule = pipe(parser, parseModule)(wat)
    indexAdapterModule(adapterModule)

    expect(adapterModule).toEqual({
      type: 'adapter module',
      modules: [],
      instances: [],
      funcs: [],
      tables: [],
      memories: [],
      globals: [],
      imports: [],
      exports: [],
      symbolIndex: {
        modules: {},
        instances: {},
        funcs: {},
        tables: {},
        memories: {},
        globals: {},
      },
    })
  })
})
