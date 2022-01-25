import { toMatchTree } from '../matchers.js'
import trimWasm from '../trim-wasm.js'
import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import indexAdapterModule from './index.js'

expect.extend({ toMatchTree })

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
        const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule).toMatchTree([
          'adapter',
          'module',
          ['module'],
          ['export', '"ex"', ['module', '0']],
        ])
        expect(adapterModule.meta.exports).toMatchTree([
          ['export', '"ex"', ['module', '0']],
        ])
        expect(adapterModule.meta.exports[0].meta).toMatchObject({
          name: 'ex',
          kind: 'module',
        })
        expect(adapterModule.meta.exports[0].meta.path()).toEqual([
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
        const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.exports).toMatchTree([
          ['export', '"ex"', ['module', '$M']],
        ])
        expect(adapterModule.meta.exports[0].meta).toMatchObject({
          name: 'ex',
          kind: 'module',
        })
        expect(adapterModule.meta.exports[0].meta.path()).toEqual([
          'modules',
          0,
        ])
      })
    })
  })
})
