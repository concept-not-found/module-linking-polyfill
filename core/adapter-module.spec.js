import { toMatchTree } from '../matchers.js'
import stripWasmWhitespace from './strip-wasm-whitespace.js'
import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import coreAdapterModule from './adapter-module.js'

expect.extend({ toMatchTree })

describe('plugin', () => {
  describe('adapter module', () => {
    test('empty adapter module', () => {
      const wat = `(adapter module)`

      const parser = Parser()
      const adapterModule = pipe(parser, stripWasmWhitespace, ([node]) =>
        coreAdapterModule(node)
      )(wat)

      expect(adapterModule).toMatchTree(['adapter', 'module'])
    })

    test('nested adapter module', () => {
      const wat = `(adapter module
        (adapter module)
      )`

      const parser = Parser()
      const adapterModule = pipe(parser, stripWasmWhitespace, ([node]) =>
        coreAdapterModule(node)
      )(wat)

      expect(adapterModule).toMatchTree([
        'adapter',
        'module',
        ['adapter', 'module'],
      ])
      expect(adapterModule.meta.modules).toMatchTree([['adapter', 'module']])
    })

    test('nested module', () => {
      const wat = `(adapter module
        (module)
      )`

      const parser = Parser()
      const adapterModule = pipe(parser, stripWasmWhitespace, ([node]) =>
        coreAdapterModule(node)
      )(wat)

      expect(adapterModule).toMatchTree(['adapter', 'module', ['module']])
      expect(adapterModule.meta.modules).toMatchTree([['module']])
    })

    test('export module', () => {
      const wat = `(adapter module
        (module)
        (export "ex" (module 0))
      )`

      const parser = Parser()
      const adapterModule = pipe(parser, stripWasmWhitespace, ([node]) =>
        coreAdapterModule(node)
      )(wat)

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
      expect(adapterModule.meta.exports[0].meta.exported).toMatchTree([
        'module',
      ])
    })

    test('import module', () => {
      const wat = `(adapter module
        (import "mod" (module))
      )`

      const parser = Parser()
      const adapterModule = pipe(parser, stripWasmWhitespace, ([node]) =>
        coreAdapterModule(node)
      )(wat)

      expect(adapterModule).toMatchTree([
        'adapter',
        'module',
        ['import', '"mod"', ['module']],
      ])
      expect(adapterModule.meta.modules).toMatchTree([
        ['import', '"mod"', ['module']],
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
      expect(adapterModule.meta.imports[0].meta.imported).toMatchTree([
        'module',
      ])
    })

    test('re-export module', () => {
      const wat = `(adapter module
        (import "mod" (module))
        (export "ex" (module 0))
      )`

      const parser = Parser()
      const adapterModule = pipe(parser, stripWasmWhitespace, ([node]) =>
        coreAdapterModule(node)
      )(wat)

      expect(adapterModule).toMatchTree([
        'adapter',
        'module',
        ['import', '"mod"', ['module']],
        ['export', '"ex"', ['module', '0']],
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
      expect(adapterModule.meta.imports[0].meta.imported).toMatchTree([
        'module',
      ])

      expect(adapterModule.meta.exports).toMatchTree([
        ['export', '"ex"', ['module', '0']],
      ])
      expect(adapterModule.meta.exports[0].meta).toMatchObject({
        name: 'ex',
        kind: 'module',
        kindIdx: 0,
      })
      expect(adapterModule.meta.exports[0].meta.exported).toMatchTree([
        'import',
        '"mod"',
        ['module'],
      ])
    })

    test('empty instance', () => {
      const wat = `(adapter module
        (instance)
      )`

      const parser = Parser()
      const adapterModule = pipe(parser, stripWasmWhitespace, ([node]) =>
        coreAdapterModule(node)
      )(wat)

      expect(adapterModule).toMatchTree(['adapter', 'module', ['instance']])
      expect(adapterModule.meta.instances).toMatchTree([['instance']])
    })

    test('instance instantiates module', () => {
      const wat = `(adapter module
        (module)
        (instance (instantiate 0))
      )`

      const parser = Parser()
      const adapterModule = pipe(parser, stripWasmWhitespace, ([node]) =>
        coreAdapterModule(node)
      )(wat)

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
      expect(adapterModule.meta.instances[0].meta.module).toMatchTree([
        'module',
      ])
    })

    test('instance exports module', () => {
      const wat = `(adapter module
        (module)
        (instance
          (export "ex" (module 0))
        )
      )`

      const parser = Parser()
      const adapterModule = pipe(parser, stripWasmWhitespace, ([node]) =>
        coreAdapterModule(node)
      )(wat)

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
      expect(
        adapterModule.meta.instances[0].meta.exports[0].meta.exported
      ).toMatchTree(['module'])
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
      const adapterModule = pipe(parser, stripWasmWhitespace, ([node]) =>
        coreAdapterModule(node)
      )(wat)

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
      expect(adapterModule.meta.aliases).toMatchTree([
        ['alias', '0', '"ex"', ['module']],
      ])
      expect(adapterModule.meta.aliases[0].meta).toMatchObject({
        type: 'instance-export',
        instanceIdx: 0,
        name: 'ex',
        kind: 'module',
      })
      expect(adapterModule.meta.aliases[0].meta.instance).toMatchTree([
        'instance',
        ['export', '"ex"', ['module', '0']],
      ])
      expect(adapterModule.meta.aliases[0].meta.aliased).toMatchTree(['module'])
    })
  })
})
