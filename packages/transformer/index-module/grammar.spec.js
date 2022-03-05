import Parser from '../parser/index.js'

import parseModule, { name, kind, kindDefinition } from './grammar.js'

describe('core module', () => {
  describe('grammar', () => {
    describe('name', () => {
      test('func', () => {
        const matcher = name
        const result = matcher({ type: 'value', value: '$f' })
        expect(result).toMatchObject({
          matched: true,
          value: '$f',
        })
      })
    })
    describe('kind', () => {
      test('func', () => {
        const matcher = kind
        const result = matcher({ type: 'value', value: 'func' })
        expect(result).toMatchObject({
          matched: true,
          value: 'func',
        })
      })
    })
    describe('kindDefinition', () => {
      test('named func', () => {
        const matcher = kindDefinition
        const result = matcher({
          type: 'sexp',
          value: [
            { type: 'value', value: 'func' },
            { type: 'value', value: '$f' },
          ],
        })
        expect(result).toMatchObject({
          matched: true,
          value: {
            type: 'func',
            name: '$f',
          },
        })
      })
    })

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
