import trimWasm from '../trim-wasm.js'
import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import indexAdapterModule from './index.js'

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
        const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.modules[1].meta.path()).toEqual([
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
        const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.modules[1].meta.path()).toEqual([
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
        const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(
          adapterModule.meta.modules[1].meta.modules[0].meta.path([
            adapterModule,
            adapterModule.meta.modules[1],
          ])
        ).toEqual(['..', 'modules', 0])
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
        const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(
          adapterModule.meta.modules[1].meta.modules[0].meta.path([
            adapterModule,
            adapterModule.meta.modules[1],
          ])
        ).toEqual(['..', 'modules', 0])
      })
    })
  })
})
