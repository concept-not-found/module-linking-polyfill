import transformer from '../index.js'

describe('adapter-module-transformer', () => {
  describe('import', () => {
    test('re-export func', () => {
      const wat = `(adapter module (;0;)
        (import "imp" (func (;0;)))
        (export "exp" (func 0))
      )`
      const adapterModule = transformer(wat)
      expect(adapterModule).toEqual({
        type: 'adapter module',
        modules: [],
        imports: {
          imp: { kind: 'func', kindType: [] },
        },
        instances: [],
        exports: {
          exp: {
            kind: 'func',
            path: ['imports', 'imp'],
          },
        },
      })
    })

    test('re-export instance', () => {
      const wat = `(adapter module (;0;)
        (import "imp" (instance (;0;)))
        (export "exp" (instance 0))
      )`
      const adapterModule = transformer(wat)
      expect(adapterModule).toEqual({
        type: 'adapter module',
        modules: [],
        imports: { imp: { kind: 'instance', exports: {} } },
        instances: [
          {
            type: 'instance',
            exports: {},
          },
        ],
        exports: {
          exp: {
            kind: 'instance',
            path: ['imports', 'imp'],
          },
        },
      })
    })

    test('re-export module', () => {
      const wat = `(adapter module (;0;)
        (import "imp" (module (;0;)))
        (export "exp" (module 0))
      )`
      const adapterModule = transformer(wat)
      expect(adapterModule).toEqual({
        type: 'adapter module',
        modules: [],
        imports: {
          imp: { kind: 'module', exports: {} },
        },
        instances: [],
        exports: {
          exp: {
            kind: 'module',
            path: ['imports', 'imp'],
          },
        },
      })
    })

    test('export func from imported instance', () => {
      const wat = `(adapter module (;0;)
        (import "imp" (instance (;0;)
          (export "f" (func))
        ))
        (alias (;instance;) 0 "f" (func (;0;)))
        (export "exp" (func 0))
      )`
      const adapterModule = transformer(wat)
      expect(adapterModule).toEqual({
        type: 'adapter module',
        modules: [],
        imports: {
          imp: {
            kind: 'instance',
            exports: {
              f: {
                kind: 'func',
              },
            },
          },
        },
        instances: [
          {
            type: 'instance',
            exports: {
              f: {
                kind: 'func',
              },
            },
          },
        ],
        exports: {
          exp: {
            kind: 'func',
            path: ['instances', 0, 'exports', 'f'],
          },
        },
      })
    })

    test('export func from imported module', () => {
      const wat = `(adapter module (;0;)
        (import "imp" (module (;0;)
          (export "f" (func))
        ))
        (instance (;0;) (instantiate (;module;) 0))
        (alias (;instance;) 0 "f" (func (;0;)))
        (export "exp" (func 0))
      )`
      const adapterModule = transformer(wat)
      expect(adapterModule).toEqual({
        type: 'adapter module',
        modules: [],
        imports: {
          imp: {
            kind: 'module',
            exports: {
              f: {
                kind: 'func',
              },
            },
          },
        },
        instances: [
          {
            type: 'module',
            path: ['imports', 'imp'],
            imports: {},
          },
        ],
        exports: {
          exp: {
            kind: 'func',
            path: ['instances', 0, 'exports', 'f'],
          },
        },
      })
    })

    test('re-export func through instance', () => {
      const wat = `(adapter module (;0;)
        (import "imp" (func (;0;)))
        (instance (;0;)
          (export "f" (func 0))
        )
        (alias (;instance;) 0 "f" (func (;1;)))
        (export "exp" (func 1))
      )`
      const adapterModule = transformer(wat)
      expect(adapterModule).toEqual({
        type: 'adapter module',
        modules: [],
        imports: {
          imp: {
            kind: 'func',
            kindType: [],
          },
        },
        instances: [
          {
            type: 'instance',
            exports: {
              f: {
                kind: 'func',
                path: ['imports', 'imp'],
              },
            },
          },
        ],
        exports: {
          exp: {
            kind: 'func',
            path: ['instances', 0, 'exports', 'f'],
          },
        },
      })
    })

    test('re-export func through module', () => {
      const wat = `(adapter module (;0;)
        (module (;0;)
          (import "mimp" "f" (func (;0;)))
          (export "mexp" (func 0))
        )
        (import "f" (func (;0;)))
        (instance (;0;)
          (export "f" (func 0))
        )
        (instance (;1;) (instantiate (;module;) 0
          (import "mimp" (instance 0))
        ))
        (alias (;instance;) 1 "mexp" (func (;1;)))
        (export "exp" (func 1))
      )`
      const adapterModule = transformer(wat)
      expect(adapterModule).toEqual({
        type: 'adapter module',
        modules: [
          {
            source: `(module (;0;)
          (import "mimp" "f" (func (;0;)))
          (export "mexp" (func 0))
        )`,
          },
        ],
        imports: {
          f: {
            kind: 'func',
            kindType: [],
          },
        },
        instances: [
          {
            type: 'instance',
            exports: {
              f: {
                kind: 'func',
                path: ['imports', 'f'],
              },
            },
          },
          {
            type: 'module',
            path: ['modules', 0],
            imports: {
              mimp: {
                kind: 'instance',
                path: ['instances', 0],
              },
            },
          },
        ],
        exports: {
          exp: {
            kind: 'func',
            path: ['instances', 1, 'exports', 'mexp'],
          },
        },
      })
    })

    test('interleave and re-export funcs', () => {
      const wat = `(adapter module
        (import "A" (func))
        (import "B" (func))
        (export "X" (func 1))
        (export "Y" (func 0))
      )`
      const adapterModule = transformer(wat)
      expect(adapterModule).toEqual({
        type: 'adapter module',
        modules: [],
        imports: {
          A: { kind: 'func', kindType: [] },
          B: { kind: 'func', kindType: [] },
        },
        instances: [],
        exports: {
          X: {
            kind: 'func',
            path: ['imports', 'B'],
          },
          Y: {
            kind: 'func',
            path: ['imports', 'A'],
          },
        },
      })
    })
  })
})
