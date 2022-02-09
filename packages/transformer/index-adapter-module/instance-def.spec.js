import { toMatchTree } from '../matchers.js'
import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import indexAdapterModule from './index.js'

expect.extend({ toMatchTree })

describe('index adapter module', () => {
  describe('instance definition', () => {
    describe('empty instance', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (instance)
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.instances[0]).toMatchTree(['instance'])
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (instance $i)
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.symbolIndex.instances.$i).toBe(0)
        expect(adapterModule.meta.instances[0]).toMatchTree(['instance', '$i'])
      })
    })

    describe('instance instantiates module', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (module)
            (instance (instantiate 0))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.instances[0].meta.modulePath()).toEqual([
          'modules',
          0,
        ])
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (module $M)
            (instance (instantiate $M))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.instances[0].meta.modulePath()).toEqual([
          'modules',
          0,
        ])
      })
    })

    describe('instance imports module', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (adapter module
              (import "self" (module))
            )
            (instance (instantiate 0
              (import "self" (module 0))
            ))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.instances[0].meta.imports).toMatchTree([
          ['import', '"self"', ['module', '0']],
        ])
        expect(
          adapterModule.meta.instances[0].meta.imports[0].meta
        ).toMatchObject({
          name: 'self',
          kind: 'module',
        })
        expect(
          adapterModule.meta.instances[0].meta.imports[0].meta.path()
        ).toEqual(['modules', 0])
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (adapter module $M
              (import "self" (module))
            )
            (instance (instantiate $M
              (import "self" (module $M))
            ))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.instances[0].meta.imports).toMatchTree([
          ['import', '"self"', ['module', '$M']],
        ])
        expect(
          adapterModule.meta.instances[0].meta.imports[0].meta
        ).toMatchObject({
          name: 'self',
          kind: 'module',
        })
        expect(
          adapterModule.meta.instances[0].meta.imports[0].meta.path()
        ).toEqual(['modules', 0])
      })
    })

    describe('instance imports func', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (adapter module
              (import "f" (func))
            )
            (import "imp" (func))
            (instance (instantiate 0
              (import "f" (func 0))
            ))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(
          adapterModule.meta.instances[0].meta.imports[0].meta.path()
        ).toEqual(['imports', 'imp'])
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (adapter module
              (import "f" (func))
            )
            (import "imp" (func $f))
            (instance (instantiate 0
              (import "f" (func $f))
            ))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(
          adapterModule.meta.instances[0].meta.imports[0].meta.path()
        ).toEqual(['imports', 'imp'])
      })
    })

    describe('instance exports module', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (module)
            (instance
              (export "ex" (module 0))
            )
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.instances[0].meta.exports).toMatchTree([
          ['export', '"ex"', ['module', '0']],
        ])
        expect(
          adapterModule.meta.instances[0].meta.exports[0].meta
        ).toMatchObject({
          name: 'ex',
          kind: 'module',
        })
        expect(
          adapterModule.meta.instances[0].meta.exports[0].meta.path()
        ).toEqual(['modules', 0])
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (module $M)
            (instance
              (export "ex" (module $M))
            )
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.instances[0].meta.exports).toMatchTree([
          ['export', '"ex"', ['module', '$M']],
        ])
        expect(
          adapterModule.meta.instances[0].meta.exports[0].meta
        ).toMatchObject({
          name: 'ex',
          kind: 'module',
        })
        expect(
          adapterModule.meta.instances[0].meta.exports[0].meta.path()
        ).toEqual(['modules', 0])
      })
    })

    describe('instance exports func', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (import "imp" (func))
            (instance
              (export "f" (func 0))
            )
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(
          adapterModule.meta.instances[0].meta.exports[0].meta.path()
        ).toEqual(['imports', 'imp'])
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (import "imp" (func $f))
            (instance
              (export "f" (func $f))
            )
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(
          adapterModule.meta.instances[0].meta.exports[0].meta.path()
        ).toEqual(['imports', 'imp'])
      })
    })

    describe('import instance', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (import "imp" (instance
              (exports "f" (func))
            ))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.instances[0]).toMatchTree([
          'import',
          '"imp"',
          ['instance', ['exports', '"f"', ['func']]],
        ])
        expect(
          adapterModule.meta.instances[0].meta.exports[0].meta
        ).toMatchObject({
          name: 'f',
          kind: 'func',
          kindType: [],
        })
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (import "imp" (instance $i
              (exports "f" (func))
            ))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.symbolIndex.instances.$i).toBe(0)
        expect(adapterModule.meta.instances[0]).toMatchTree([
          'import',
          '"imp"',
          ['instance', '$i', ['exports', '"f"', ['func']]],
        ])
        expect(
          adapterModule.meta.instances[0].meta.exports[0].meta
        ).toMatchObject({
          name: 'f',
          kind: 'func',
          kindType: [],
        })
      })
    })

    describe('alias instance', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (import "imp" (instance
              (exports "f" (func))
            ))
            (alias 0 0 (instance))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.instances[1]).toMatchTree([
          'alias',
          '0',
          '0',
          ['instance'],
        ])
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (import "imp" (instance
              (exports "f" (func))
            ))
            (alias 0 0 (instance $i))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.symbolIndex.instances.$i).toBe(1)
        expect(adapterModule.meta.instances[1]).toMatchTree([
          'alias',
          '0',
          '0',
          ['instance', '$i'],
        ])
      })
    })
  })
})
