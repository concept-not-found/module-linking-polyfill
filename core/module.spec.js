import { toMatchTree } from '../matchers.js'
import stripWasmWhitespace from './strip-wasm-whitespace.js'
import pipe from '../pipe.js'
import SexpToWasm from '../map-sexp-by-tag.js'
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
      const [module] = pipe(
        parser,
        stripWasmWhitespace,
        SexpToWasm({ module: coreModule })
      )(wat)

      expect(module).toMatchTree(['module', ['func']])
      expect(module.meta.funcs).toMatchTree([['func']])
    })

    test('func calls itself', () => {
      const wat = `(module
        (func
          (call 0)
        )
      )`

      const parser = Parser()
      const [module] = pipe(
        parser,
        stripWasmWhitespace,
        SexpToWasm({ module: coreModule })
      )(wat)

      expect(module).toMatchTree(['module', ['func', ['call', '0']]])
      expect(module.meta.funcs).toMatchTree([['func', ['call', '0']]])
      expect(module.meta.funcs[0].meta.calls).toMatchTree([['call', '0']])
      expect(module.meta.funcs[0].meta.calls[0].meta).toMatchObject({
        funcIdx: 0,
      })
      expect(module.meta.funcs[0].meta.calls[0].meta.source).toMatchTree([
        'func',
        ['call', '0'],
      ])
      expect(module.meta.funcs[0].meta.calls[0].meta.target).toMatchTree([
        'func',
        ['call', '0'],
      ])
    })

    test('exported func', () => {
      const wat = `(module
        (export "ex" (func 0))
        (func)
      )`

      const parser = Parser()
      const [module] = pipe(
        parser,
        stripWasmWhitespace,
        SexpToWasm({ module: coreModule })
      )(wat)

      expect(module).toMatchTree([
        'module',
        ['export', '"ex"', ['func', '0']],
        ['func'],
      ])
      expect(module.meta.funcs).toMatchTree([['func']])
      expect(module.meta.funcs[0].meta.exportedBy).toMatchTree([
        ['export', '"ex"', ['func', '0']],
      ])
      expect(module.meta.exports).toMatchTree([
        ['export', '"ex"', ['func', '0']],
      ])
      expect(module.meta.exports[0].meta).toMatchObject({
        name: 'ex',
        kind: 'func',
        kindIdx: 0,
      })
      expect(module.meta.exports[0].meta.exported).toMatchTree(['func'])
    })

    test('imported func', () => {
      const wat = `(module
        (import "mod" "im" (func))
      )`

      const parser = Parser()
      const [module] = pipe(
        parser,
        stripWasmWhitespace,
        SexpToWasm({ module: coreModule })
      )(wat)

      expect(module).toMatchTree([
        'module',
        ['import', '"mod"', '"im"', ['func']],
      ])
      expect(module.meta.funcs).toMatchTree([['func']])
      expect(module.meta.funcs[0].meta.import).toMatchTree([
        'import',
        '"mod"',
        '"im"',
        ['func'],
      ])
      expect(module.meta.imports).toMatchTree([
        ['import', '"mod"', '"im"', ['func']],
      ])
      expect(module.meta.imports[0].meta).toMatchObject({
        module: 'mod',
        name: 'im',
        kind: 'func',
        kindType: [],
      })
      expect(module.meta.imports[0].meta.imported).toMatchTree(['func'])
    })

    test('exported func calls imported func', () => {
      const wat = `(module
        (import "mod" "im" (func))
        (export "ex" (func 1))
        (func
          (call 0)
        )
      )`

      const parser = Parser()
      const [module] = pipe(
        parser,
        stripWasmWhitespace,
        SexpToWasm({ module: coreModule })
      )(wat)

      expect(module).toMatchTree([
        'module',
        ['import', '"mod"', '"im"', ['func']],
        ['export', '"ex"', ['func', '1']],
        ['func', ['call', '0']],
      ])
      expect(module.meta.funcs).toMatchTree([['func'], ['func', ['call', '0']]])

      expect(module.meta.funcs[1].meta.calls).toMatchTree([['call', '0']])
      expect(module.meta.funcs[1].meta.calls[0].meta).toMatchObject({
        funcIdx: 0,
      })
      expect(module.meta.funcs[1].meta.calls[0].meta.source).toMatchTree([
        'func',
        ['call', '0'],
      ])
      expect(module.meta.funcs[1].meta.calls[0].meta.target).toMatchTree([
        'func',
      ])

      expect(module.meta.funcs[0].meta.import).toMatchTree([
        'import',
        '"mod"',
        '"im"',
        ['func'],
      ])
      expect(module.meta.imports).toMatchTree([
        ['import', '"mod"', '"im"', ['func']],
      ])
      expect(module.meta.imports[0].meta).toMatchObject({
        module: 'mod',
        name: 'im',
        kind: 'func',
        kindType: [],
      })
      expect(module.meta.imports[0].meta.imported).toMatchTree(['func'])

      expect(module.meta.funcs[1].meta.exportedBy).toMatchTree([
        ['export', '"ex"', ['func', '1']],
      ])
      expect(module.meta.exports).toMatchTree([
        ['export', '"ex"', ['func', '1']],
      ])
      expect(module.meta.exports[0].meta).toMatchObject({
        name: 'ex',
        kind: 'func',
        kindIdx: 1,
      })
      expect(module.meta.exports[0].meta.exported).toMatchTree([
        'func',
        ['call', '0'],
      ])
    })
  })
})
