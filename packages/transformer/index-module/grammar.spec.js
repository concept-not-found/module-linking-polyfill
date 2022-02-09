import Parser from '../parser/index.js'

import parseModule from './grammar.js'

describe('core module', () => {
  describe('parser', () => {
    test('empty module', () => {
      const wat = `
        (module
        )
      `
      const parser = Parser()
      const input = parser(wat)
      const module = parseModule(input)
      expect(module).toEqual({
        type: 'module',
        definitions: [],
      })
    })

    test('single func', () => {
      const wat = `
        (module
          (func)
        )
      `
      const parser = Parser()
      const input = parser(wat)
      const module = parseModule(input)
      expect(module).toEqual({
        type: 'module',
        definitions: [
          {
            type: 'func',
          },
        ],
      })
    })

    test('double func', () => {
      const wat = `
        (module
          (func)
          (func)
        )
      `
      const parser = Parser()
      const input = parser(wat)
      const module = parseModule(input)
      expect(module).toEqual({
        type: 'module',
        definitions: [
          {
            type: 'func',
          },
          {
            type: 'func',
          },
        ],
      })
    })

    test('named func', () => {
      const wat = `
        (module
          (func $f)
        )
      `
      const parser = Parser()
      const input = parser(wat)
      const module = parseModule(input)
      expect(module).toEqual({
        type: 'module',
        definitions: [
          {
            type: 'func',
            name: '$f',
          },
        ],
      })
    })

    test('exported func', () => {
      const wat = `
        (module
          (export "exp" (func $f))
          (func $f)
        )
      `
      const parser = Parser()
      const input = parser(wat)
      const module = parseModule(input)
      expect(module).toEqual({
        type: 'module',
        definitions: [
          {
            type: 'export',
            name: 'exp',
            kindReference: {
              kind: 'func',
              kindIdx: '$f',
            },
          },
          {
            type: 'func',
            name: '$f',
          },
        ],
      })
    })
    test('imported func', () => {
      const wat = `
        (module
          (import "imp" "f" (func $f))
        )
      `
      const parser = Parser()
      const input = parser(wat)
      const module = parseModule(input)
      expect(module).toEqual({
        type: 'module',
        definitions: [
          {
            type: 'func',
            name: '$f',
            import: {
              moduleName: 'imp',
              name: 'f',
            },
          },
        ],
      })
    })
  })
})
