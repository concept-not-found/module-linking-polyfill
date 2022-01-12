import transformer from '../index.js'

describe('adapter-module-transformer', () => {
  describe('export', () => {
    test('export module func', () => {
      const adapterModule = `(adapter module (;0;)
        (module (;0;)
          (func (;0;))
          (export "f" (func 0))
        )
        (instance (;0;) (instantiate (;module;) 0))
        (alias (;instance;) 0 "f" (func (;0;)))
        (export "exp" (func 0))
      )`
      const { modules, imports, instances, exports } =
        transformer(adapterModule)
      expect(modules).toEqual([
        {
          index: 0,
          source: `(module (;0;)
          (func (;0;))
          (export "f" (func 0))
        )`,
        },
      ])
      expect(imports).toEqual({})
      expect(instances).toEqual([
        {
          index: 0,
          type: 'module',
          path: ['modules', 0],
          imports: {},
        },
      ])
      expect(exports).toEqual({
        exp: {
          kind: 'func',
          path: ['instances', 0, 'exports', 'f'],
        },
      })
    })

    test('export instance', () => {
      const adapterModule = `(adapter module (;0;)
        (instance (;0;))
        (export "exp" (instance 0))
      )`
      const { modules, imports, instances, exports } =
        transformer(adapterModule)
      expect(modules).toEqual([])
      expect(imports).toEqual({})
      expect(instances).toEqual([
        {
          index: 0,
          type: 'instance',
          exports: {},
        },
      ])
      expect(exports).toEqual({
        exp: {
          kind: 'instance',
          path: ['instances', 0],
        },
      })
    })

    test('export module', () => {
      const adapterModule = `(adapter module (;0;)
        (module (;0;))
        (export "exp" (module 0))
      )`
      const { modules, imports, instances, exports } =
        transformer(adapterModule)
      expect(modules).toEqual([
        {
          index: 0,
          source: `(module (;0;))`,
        },
      ])
      expect(imports).toEqual({})
      expect(instances).toEqual([])
      expect(exports).toEqual({
        exp: {
          kind: 'module',
          path: ['modules', 0],
        },
      })
    })

    test('export module instance', () => {
      const adapterModule = `(adapter module (;0;)
        (module (;0;))
        (instance (;0;) (instantiate (;module;) 0))
        (export "exp" (instance 0))
      )`
      const { modules, imports, instances, exports } =
        transformer(adapterModule)
      expect(modules).toEqual([
        {
          index: 0,
          source: `(module (;0;))`,
        },
      ])
      expect(imports).toEqual({})
      expect(instances).toEqual([
        {
          index: 0,
          type: 'module',
          path: ['modules', 0],
          imports: {},
        },
      ])
      expect(exports).toEqual({
        exp: {
          kind: 'instance',
          path: ['instances', 0],
        },
      })
    })
  })
})
