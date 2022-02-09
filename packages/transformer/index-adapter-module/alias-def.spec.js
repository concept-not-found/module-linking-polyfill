import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import indexAdapterModule from './index.js'
import parseModule from './grammar.js'

describe('index adapter module', () => {
  describe('alias definition', () => {
    describe('instance export', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (module)
            (instance
              (export "ex" (module 0))
            )
            (alias 0 "ex" (module))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.modules[1].path()).toEqual([
          'instances',
          0,
          'exports',
          'ex',
        ])
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (module)
            (instance $i
              (export "ex" (module 0))
            )
            (alias $i "ex" (module))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.modules[1].path()).toEqual([
          'instances',
          0,
          'exports',
          'ex',
        ])
      })
    })

    describe('outer', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (module)
            (adapter module
              (alias 1 0 (module))
            )
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        const ancestors = [adapterModule, adapterModule.modules[1]]
        expect(adapterModule.modules[1].modules[0].path(ancestors)).toEqual([
          '..',
          'modules',
          0,
        ])
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (module $M)
            (adapter module
              (alias 1 $M (module))
            )
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        const ancestors = [adapterModule, adapterModule.modules[1]]
        expect(adapterModule.modules[1].modules[0].path(ancestors)).toEqual([
          '..',
          'modules',
          0,
        ])
      })
    })
  })
})
