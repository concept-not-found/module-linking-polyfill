import { toMatchTree } from '../matchers.js'
import trimWasm from '../trim-wasm.js'
import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import indexAdapterModule from './index.js'

expect.extend({ toMatchTree })

describe('plugin', () => {
  describe('adapter module', () => {
    test('empty adapter module', () => {
      const wat = `(adapter module)`

      const parser = Parser()
      const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
      indexAdapterModule(adapterModule)

      expect(adapterModule).toMatchTree(['adapter', 'module'])
      expect(adapterModule.meta.modules).toEqual([])
    })

    describe('nested adapter module', () => {
      test('implicit index', () => {
        const wat = `(adapter module
          (adapter module)
        )`

        const parser = Parser()
        const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.modules[0]).toMatchTree(['adapter', 'module'])
      })

      test('explicit index', () => {
        const wat = `(adapter module
          (adapter module $M)
        )`

        const parser = Parser()
        const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.symbolIndex.modules.$M).toBe(0)
        expect(adapterModule.meta.modules[0]).toMatchTree([
          'adapter',
          'module',
          '$M',
        ])
      })
    })

    describe('nested module', () => {
      test('implicit index', () => {
        const wat = `(adapter module
          (module)
        )`

        const parser = Parser()
        const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.modules[0]).toMatchTree(['module'])
      })

      test('explicit index', () => {
        const wat = `(adapter module
          (module $M)
        )`

        const parser = Parser()
        const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.symbolIndex.modules.$M).toBe(0)
        expect(adapterModule.meta.modules[0]).toMatchTree(['module', '$M'])
      })
    })

    describe('export module', () => {
      test('implicit index', () => {
        const wat = `(adapter module
          (module)
          (export "ex" (module 0))
        )`

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
          kindIdx: 0,
        })
      })

      test('explicit index', () => {
        const wat = `(adapter module
          (module $M)
          (export "ex" (module $M))
        )`

        const parser = Parser()
        const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.exports).toMatchTree([
          ['export', '"ex"', ['module', '$M']],
        ])
        expect(adapterModule.meta.exports[0].meta).toMatchObject({
          name: 'ex',
          kind: 'module',
          kindIdx: 0,
        })
      })
    })

    describe('import module', () => {
      test('implicit index', () => {
        const wat = `(adapter module
          (import "mod" (module))
        )`

        const parser = Parser()
        const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
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
        const wat = `(adapter module
          (import "mod" (module $M))
        )`

        const parser = Parser()
        const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
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

    describe('re-export module', () => {
      test('implicit index', () => {
        const wat = `(adapter module
          (import "mod" (module))
          (export "ex" (module 0))
        )`

        const parser = Parser()
        const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.exports[0].meta.path()).toEqual([
          'imports',
          'mod',
        ])
      })

      test('implicit index', () => {
        const wat = `(adapter module
          (import "mod" (module $M))
          (export "ex" (module $M))
        )`

        const parser = Parser()
        const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.meta.exports[0].meta.path()).toEqual([
          'imports',
          'mod',
        ])
      })
    })

    test('empty instance', () => {
      const wat = `(adapter module
        (instance)
      )`

      const parser = Parser()
      const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
      indexAdapterModule(adapterModule)

      expect(adapterModule).toMatchTree(['adapter', 'module', ['instance']])
      expect(adapterModule.meta.instances).toMatchTree([['instance']])
    })

    test('instance instantiates module', () => {
      const wat = `(adapter module
        (module)
        (instance (instantiate 0))
      )`

      const parser = Parser()
      const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
      indexAdapterModule(adapterModule)

      expect(adapterModule).toMatchTree([
        'adapter',
        'module',
        ['module'],
        ['instance', ['instantiate', '0']],
      ])
      expect(adapterModule.meta.instances).toMatchTree([
        ['instance', ['instantiate', '0']],
      ])
      expect(adapterModule.meta.instances[0].meta).toMatchObject({
        moduleIdx: 0,
      })
    })

    test('instance exports module', () => {
      const wat = `(adapter module
        (module)
        (instance
          (export "ex" (module 0))
        )
      )`

      const parser = Parser()
      const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
      indexAdapterModule(adapterModule)

      expect(adapterModule).toMatchTree([
        'adapter',
        'module',
        ['module'],
        ['instance', ['export', '"ex"', ['module', '0']]],
      ])
      expect(adapterModule.meta.instances).toMatchTree([
        ['instance', ['export', '"ex"', ['module', '0']]],
      ])
      expect(adapterModule.meta.instances[0].meta.exports).toMatchTree([
        ['export', '"ex"', ['module', '0']],
      ])
      expect(
        adapterModule.meta.instances[0].meta.exports[0].meta
      ).toMatchObject({
        name: 'ex',
        kind: 'module',
        kindIdx: 0,
      })
    })

    test('alias instance export', () => {
      const wat = `(adapter module
        (module)
        (instance
          (export "ex" (module 0))
        )
        (alias 0 "ex" (module))
      )`

      const parser = Parser()
      const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
      indexAdapterModule(adapterModule)

      expect(adapterModule).toMatchTree([
        'adapter',
        'module',
        ['module'],
        ['instance', ['export', '"ex"', ['module', '0']]],
        ['alias', '0', '"ex"', ['module']],
      ])
      expect(adapterModule.meta.modules).toMatchTree([
        ['module'],
        ['alias', '0', '"ex"', ['module']],
      ])
      expect(adapterModule.meta.modules[1].meta.alias).toBe(true)
    })

    test('alias outer', () => {
      const wat = `(adapter module
        (module)
        (adapter module
          (alias 1 0 (module))
        )
      )`

      const parser = Parser()
      const adapterModule = pipe(parser, trimWasm, ([node]) => node)(wat)
      indexAdapterModule(adapterModule)

      expect(adapterModule).toMatchTree([
        'adapter',
        'module',
        ['module'],
        ['adapter', 'module', ['alias', '1', '0', ['module']]],
      ])
      expect(adapterModule.meta.modules).toMatchTree([
        ['module'],
        ['adapter', 'module', ['alias', '1', '0', ['module']]],
      ])
      expect(adapterModule.meta.modules[1].meta.modules[0].meta.alias).toBe(
        true
      )
    })
  })
})
