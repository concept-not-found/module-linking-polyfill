import { toMatchTree } from '../matchers.js'
import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import indexModule from './index.js'

expect.extend({ toMatchTree })

describe('index module', () => {
  describe('empty func', () => {
    test('implicit index', () => {
      const wat = `
        (module
          (func)
        )
      `

      const parser = Parser()
      const module = pipe(parser, ([node]) => node)(wat)
      indexModule(module)

      expect(module.meta.funcs[0]).toMatchTree(['func'])
    })
    test('explicit index', () => {
      const wat = `
        (module
          (func $f)
        )
      `

      const parser = Parser()
      const module = pipe(parser, ([node]) => node)(wat)
      indexModule(module)

      expect(module.meta.symbolIndex.funcs.$f).toBe(0)
      expect(module.meta.funcs[0]).toMatchTree(['func', '$f'])
    })
  })

  describe('export func', () => {
    test('implicit index', () => {
      const wat = `
        (module
          (export "ex" (func 0))
          (func)
        )
      `

      const parser = Parser()
      const module = pipe(parser, ([node]) => node)(wat)
      indexModule(module)

      expect(module.meta.exports).toMatchTree([
        ['export', '"ex"', ['func', '0']],
      ])
      expect(module.meta.exports[0].meta).toMatchObject({
        name: 'ex',
        kind: 'func',
      })
      expect(module.meta.exports[0].meta.path()).toEqual(['funcs', 0])
    })

    test('explicit index', () => {
      const wat = `
        (module
          (export "ex" (func $f))
          (func $f)
        )
      `

      const parser = Parser()
      const module = pipe(parser, ([node]) => node)(wat)
      indexModule(module)

      expect(module.meta.exports).toMatchTree([
        ['export', '"ex"', ['func', '$f']],
      ])
      expect(module.meta.exports[0].meta).toMatchObject({
        name: 'ex',
        kind: 'func',
      })
      expect(module.meta.exports[0].meta.path()).toEqual(['funcs', 0])
    })
  })

  describe('import func', () => {
    test('implicit index', () => {
      const wat = `
        (module
          (import "mod" "im" (func))
        )
      `

      const parser = Parser()
      const module = pipe(parser, ([node]) => node)(wat)
      indexModule(module)

      const expectedImportFunc = ['import', '"mod"', '"im"', ['func']]
      expect(module.meta.funcs[0]).toMatchTree(expectedImportFunc)
      expect(module.meta.imports).toMatchTree([expectedImportFunc])
      expect(module.meta.imports[0].meta).toMatchObject({
        moduleName: 'mod',
        name: 'im',
        kind: 'func',
      })
    })

    test('explicit index', () => {
      const wat = `
        (module
          (import "mod" "im" (func $f))
        )
      `

      const parser = Parser()
      const module = pipe(parser, ([node]) => node)(wat)
      indexModule(module)

      expect(module.meta.symbolIndex.funcs.$f).toBe(0)
      const expectedImportFunc = ['import', '"mod"', '"im"', ['func', '$f']]
      expect(module.meta.funcs[0]).toMatchTree(expectedImportFunc)
      expect(module.meta.imports).toMatchTree([expectedImportFunc])
      expect(module.meta.imports[0].meta).toMatchObject({
        moduleName: 'mod',
        name: 'im',
        kind: 'func',
      })
    })
  })
})
