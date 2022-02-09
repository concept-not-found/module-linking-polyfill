import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import indexAdapterModule from './index.js'
import parseModule from './grammar.js'

describe('index adapter module', () => {
  describe('module definition', () => {
    describe('adapter module', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (adapter module)
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.modules[0]).toEqual({
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

      test('explicit index', () => {
        const wat = `
          (adapter module
            (adapter module $M)
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.symbolIndex.modules.$M).toBe(0)
        expect(adapterModule.modules[0]).toEqual({
          type: 'adapter module',
          name: '$M',
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

    describe('module', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (module)
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.modules[0]).toEqual({
          type: 'module',
          imports: [],
          exports: [],
          funcs: [],
          tables: [],
          memories: [],
          globals: [],
          symbolIndex: {
            funcs: {},
            tables: {},
            memories: {},
            globals: {},
          },
        })
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (module $M)
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.symbolIndex.modules.$M).toBe(0)
        expect(adapterModule.modules[0]).toEqual({
          type: 'module',
          name: '$M',
          imports: [],
          exports: [],
          funcs: [],
          tables: [],
          memories: [],
          globals: [],
          symbolIndex: {
            funcs: {},
            tables: {},
            memories: {},
            globals: {},
          },
        })
      })
    })

    describe('import adapter module', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (import "mod" (module))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.modules[0]).toEqual({
          type: 'module',
          imports: [],
          exports: [],
          import: {
            name: 'mod',
          },
        })
        expect(adapterModule.imports[0]).toEqual({
          type: 'module',
          imports: [],
          exports: [],
          import: {
            name: 'mod',
          },
        })
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (import "mod" (module $M))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.symbolIndex.modules.$M).toBe(0)
        expect(adapterModule.modules[0]).toEqual({
          type: 'module',
          name: '$M',
          imports: [],
          exports: [],
          import: {
            name: 'mod',
          },
        })
        expect(adapterModule.imports[0]).toEqual({
          type: 'module',
          name: '$M',
          imports: [],
          exports: [],
          import: {
            name: 'mod',
          },
        })
      })
    })

    describe('alias module', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (alias 1 0 (module))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.modules[0]).toEqual({
          type: 'module',
          alias: {
            type: 'outer',
            outerIdx: 1,
            kindIdx: 0,
          },
        })
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (alias 1 0 (module $M))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.symbolIndex.modules.$M).toBe(0)
        expect(adapterModule.modules[0]).toEqual({
          type: 'module',
          name: '$M',
          alias: {
            type: 'outer',
            outerIdx: 1,
            kindIdx: 0,
          },
        })
      })
    })
  })
})
