import { toMatchTree } from '../matchers.js'
import stripWasmWhitespace from './strip-wasm-whitespace.js'
import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import coreModule from './module.js'

expect.extend({ toMatchTree })

describe('core', () => {
  describe('module', () => {
    test('empty func', () => {
      const wat = `(module
        (func)
      )`

      const parser = Parser()
      const module = pipe(parser, stripWasmWhitespace, ([node]) => node)(wat)
      coreModule(module)

      expect(module).toMatchTree(['module', ['func']])
      expect(module.meta.funcs).toMatchTree([['func']])
    })

    test('export func', () => {
      const wat = `(module
        (export "ex" (func 0))
        (func)
      )`

      const parser = Parser()
      const module = pipe(parser, stripWasmWhitespace, ([node]) => node)(wat)
      coreModule(module)

      expect(module).toMatchTree([
        'module',
        ['export', '"ex"', ['func', '0']],
        ['func'],
      ])
      expect(module.meta.funcs).toMatchTree([['func']])
      expect(module.meta.exports).toMatchTree([
        ['export', '"ex"', ['func', '0']],
      ])
      expect(module.meta.exports[0].meta).toMatchObject({
        name: 'ex',
        kind: 'func',
        kindIdx: 0,
      })
    })

    test('imported func', () => {
      const wat = `(module
        (import "mod" "im" (func))
      )`

      const parser = Parser()
      const module = pipe(parser, stripWasmWhitespace, ([node]) => node)(wat)
      coreModule(module)

      expect(module).toMatchTree([
        'module',
        ['import', '"mod"', '"im"', ['func']],
      ])
      expect(module.meta.funcs).toMatchTree([
        ['import', '"mod"', '"im"', ['func']],
      ])
      expect(module.meta.imports).toMatchTree([
        ['import', '"mod"', '"im"', ['func']],
      ])
      expect(module.meta.imports[0].meta).toMatchObject({
        moduleName: 'mod',
        name: 'im',
        kind: 'func',
        kindType: [],
      })
    })
  })
})
