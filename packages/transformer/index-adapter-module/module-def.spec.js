import { toMatchTree } from '../matchers.js'
import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import indexAdapterModule from './index.js'

expect.extend({ toMatchTree })

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
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.modules[0]).toMatchTree(['adapter', 'module'])
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (adapter module $M)
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.symbolIndex.modules.$M).toBe(0)
        expect(adapterModule.meta.modules[0]).toMatchTree([
          'adapter',
          'module',
          '$M',
        ])
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
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.modules[0]).toMatchTree(['module'])
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (module $M)
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.symbolIndex.modules.$M).toBe(0)
        expect(adapterModule.meta.modules[0]).toMatchTree(['module', '$M'])
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
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.modules[0]).toMatchTree([
          'import',
          '"mod"',
          ['module'],
        ])
        expect(adapterModule.meta.modules[0].meta.import).toBe(true)
        expect(adapterModule.meta.imports).toMatchTree([
          ['import', '"mod"', ['module']],
        ])
        expect(adapterModule.meta.imports[0].meta).toMatchObject({
          moduleName: 'mod',
          kind: 'module',
          kindType: [],
        })
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (import "mod" (module $M))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.symbolIndex.modules.$M).toBe(0)
        expect(adapterModule.meta.modules[0]).toMatchTree([
          'import',
          '"mod"',
          ['module', '$M'],
        ])
        expect(adapterModule.meta.modules[0].meta.import).toBe(true)
        expect(adapterModule.meta.imports).toMatchTree([
          ['import', '"mod"', ['module', '$M']],
        ])
        expect(adapterModule.meta.imports[0].meta).toMatchObject({
          moduleName: 'mod',
          kind: 'module',
          kindType: [],
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
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.modules[0]).toMatchTree([
          'alias',
          '1',
          '0',
          ['module'],
        ])
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (alias 1 0 (module $M))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.symbolIndex.modules.$M).toBe(0)
        expect(adapterModule.meta.modules[0]).toMatchTree([
          'alias',
          '1',
          '0',
          ['module', '$M'],
        ])
      })
    })
  })
})
