import transformer from '../index.js'

describe('adapter-module-transformer', () => {
  describe('import', () => {
    test('re-export func', () => {
      const adapterModule = `(adapter module (;0;)
        (import "imp" (func (;0;)))
        (export "exp" (func 0))
      )`
      const { modules, imports, instances, exports } =
        transformer(adapterModule)
      expect(modules).toEqual([])
      expect(imports).toEqual({
        imp: { kind: 'func', kindType: [] },
      })
      expect(instances).toEqual([])
      expect(exports).toEqual({
        exp: {
          kind: 'func',
          path: ['imports', 'imp'],
        },
      })
    })

    test('re-export instance', () => {
      const adapterModule = `(adapter module (;0;)
        (import "imp" (instance (;0;)))
        (export "exp" (instance 0))
      )`
      const { modules, imports, instances, exports } =
        transformer(adapterModule)
      expect(modules).toEqual([])
      expect(imports).toEqual({
        imp: { kind: 'instance', exports: {} },
      })
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
          path: ['imports', 'imp'],
        },
      })
    })

    test('re-export module', () => {
      const adapterModule = `(adapter module (;0;)
        (import "imp" (module (;1;)))
        (export "exp" (module 1))
      )`
      const { modules, imports, instances, exports } =
        transformer(adapterModule)
      expect(modules).toEqual([])
      expect(imports).toEqual({
        imp: { kind: 'module', exports: {} },
      })
      expect(instances).toEqual([])
      expect(exports).toEqual({
        exp: {
          kind: 'module',
          path: ['imports', 'imp'],
        },
      })
    })

    test('export func from imported instance', () => {
      const adapterModule = `(adapter module (;0;)
        (import "imp" (instance (;0;)
          (export "f" (func))
        ))
        (alias (;instance;) 0 "f" (func (;0;)))
        (export "exp" (func 0))
      )`
      const { modules, imports, instances, exports } =
        transformer(adapterModule)
      expect(modules).toEqual([])
      expect(imports).toEqual({
        imp: {
          kind: 'instance',
          exports: {
            f: {
              kind: 'func',
            },
          },
        },
      })
      expect(instances).toEqual([
        {
          index: 0,
          type: 'instance',
          exports: {
            f: {
              kind: 'func',
            },
          },
        },
      ])
      expect(exports).toEqual({
        exp: {
          kind: 'func',
          path: ['instances', 0, 'exports', 'f'],
        },
      })
    })

    test('export func from imported module', () => {
      const adapterModule = `(adapter module (;0;)
        (import "imp" (module (;1;)
          (export "f" (func))
        ))
        (instance (;0;) (instantiate (;module;) 1))
        (alias (;instance;) 0 "f" (func (;0;)))
        (export "exp" (func 0))
      )`
      const { modules, imports, instances, exports } =
        transformer(adapterModule)
      expect(modules).toEqual([])
      expect(imports).toEqual({
        imp: {
          kind: 'module',
          exports: {
            f: {
              kind: 'func',
            },
          },
        },
      })
      expect(instances).toEqual([
        {
          index: 0,
          type: 'module',
          path: ['imports', 'imp'],
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

    test('re-export func through instance', () => {
      const adapterModule = `(adapter module (;0;)
        (import "imp" (func (;0;)))
        (instance (;0;)
          (export "f" (func 0))
        )
        (alias (;instance;) 0 "f" (func (;1;)))
        (export "exp" (func 1))
      )`
      const { modules, imports, instances, exports } =
        transformer(adapterModule)
      expect(modules).toEqual([])
      expect(imports).toEqual({
        imp: {
          kind: 'func',
          kindType: [],
        },
      })
      expect(instances).toEqual([
        {
          index: 0,
          type: 'instance',
          exports: {
            f: {
              kind: 'func',
              path: ['imports', 'imp'],
            },
          },
        },
      ])
      expect(exports).toEqual({
        exp: {
          kind: 'func',
          path: ['instances', 0, 'exports', 'f'],
        },
      })
    })

    test('re-export func through module', () => {
      const adapterModule = `(adapter module (;0;)
        (module (;1;)
          (import "mimp" "f" (func (;0;)))
          (export "mexp" (func 0))
        )
        (import "f" (func (;0;)))
        (instance (;0;)
          (export "f" (func 0))
        )
        (instance (;1;) (instantiate (;module;) 1
          (import "mimp" (instance 0))
        ))
        (alias (;instance;) 1 "mexp" (func (;1;)))
        (export "exp" (func 1))
      )`
      const { modules, imports, instances, exports } =
        transformer(adapterModule)
      expect(modules).toEqual([
        {
          index: 1,
          source: `(module (;1;)
          (import "mimp" "f" (func (;0;)))
          (export "mexp" (func 0))
        )`,
        },
      ])
      expect(imports).toEqual({
        f: {
          kind: 'func',
          kindType: [],
        },
      })
      expect(instances).toEqual([
        {
          index: 0,
          type: 'instance',
          exports: {
            f: {
              kind: 'func',
              path: ['imports', 'f'],
            },
          },
        },
        {
          index: 1,
          type: 'module',
          path: ['modules', 0],
          imports: {
            mimp: {
              kind: 'instance',
              path: ['instances', 0],
            },
          },
        },
      ])
      expect(exports).toEqual({
        exp: {
          kind: 'func',
          path: ['instances', 1, 'exports', 'mexp'],
        },
      })
    })

    test('interleave and re-export funcs', () => {
      const adapterModule = `(adapter module
        (import "A" (func))
        (import "B" (func))
        (export "X" (func 1))
        (export "Y" (func 0))
      )`
      const { modules, imports, instances, exports } =
        transformer(adapterModule)
      expect(modules).toEqual([])
      expect(imports).toEqual({
        A: { kind: 'func', kindType: [] },
        B: { kind: 'func', kindType: [] },
      })
      expect(instances).toEqual([])
      expect(exports).toEqual({
        X: {
          kind: 'func',
          path: ['imports', 'B'],
        },
        Y: {
          kind: 'func',
          path: ['imports', 'A'],
        },
      })
    })
  })
})
