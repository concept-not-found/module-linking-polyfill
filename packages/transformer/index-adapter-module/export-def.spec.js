import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import indexAdapterModule from './index.js'
import parseModule from './grammar.js'

describe('index adapter module', () => {
  describe('export defintion', () => {
    describe('module', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (module)
            (export "ex" (module 0))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.exports).toEqual([
          {
            type: 'export',
            name: 'ex',
            kindReference: {
              kind: 'module',
              kindIdx: 0,
            },
          },
        ])
        expect(adapterModule.exports[0].kindReference.path()).toEqual([
          'modules',
          0,
        ])
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (module $M)
            (export "ex" (module $M))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.exports).toEqual([
          {
            type: 'export',
            name: 'ex',
            kindReference: {
              kind: 'module',
              kindIdx: '$M',
            },
          },
        ])
        expect(adapterModule.exports[0].kindReference.path()).toEqual([
          'modules',
          0,
        ])
      })
    })
  })
})
