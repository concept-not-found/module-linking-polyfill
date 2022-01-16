import transformer from '../index.js'

describe('adapter-module-transformer', () => {
  describe('import', () => {
    test('two instances of same module with independent memory', () => {
      const wat = `(adapter module (;0;)
        (module (;0;)
          (memory 1)
          (func (;0;) (param (;0;) i32)
            (i32.const (;address;) 0)
            (local.get (;param;) 0)
            (i32.store)
          )
          (export "store" (func 0))
        )
        (instance (;0;) (instantiate (;module;) 0))
        (instance (;1;) (instantiate (;module;) 0))
        (alias (;instance;) 0 "store" (func (;0;)))
        (alias (;instance;) 1 "store" (func (;1;)))
        (export "store instance 0" (func 0))
        (export "store instance 1" (func 1))
      )`
      const adapterModule = transformer(wat)
      expect(adapterModule).toEqual({
        kind: 'adapter module',
        modules: [
          {
            kind: 'module',
            source: `(module (;0;)
          (memory 1)
          (func (;0;) (param (;0;) i32)
            (i32.const (;address;) 0)
            (local.get (;param;) 0)
            (i32.store)
          )
          (export "store" (func 0))
        )`,
          },
        ],
        imports: {},
        instances: [
          {
            kind: 'module',
            path: ['modules', 0],
            imports: {},
          },
          {
            kind: 'module',
            path: ['modules', 0],
            imports: {},
          },
        ],
        exports: {
          'store instance 0': {
            kind: 'func',
            path: ['instances', 0, 'exports', 'store'],
          },
          'store instance 1': {
            kind: 'func',
            path: ['instances', 1, 'exports', 'store'],
          },
        },
      })
    })

    test('module shares memory with another', () => {
      const wat = `(adapter module (;0;)
        (module (;0;)
          (memory (;0;) 1)
          (export "mem" (memory 0))
          (func (;0;) (result (;0;) i32)
            (i32.const (;address;) 0)
            (i32.load)
          )
          (export "load" (func 0))
        )
        (module (;1;)
          (import "imp" "mem" (memory 1))
          (func (;0;) (param (;0;) i32)
            (i32.const (;address;) 0)
            (local.get (;param;) 0)
            (i32.store)
          )
          (export "store" (func 0))
        )
        (instance (;0;) (instantiate (;module;) 0))
        (instance (;1;) (instantiate (;module;) 1
          (import "imp" (instance 0))
        ))
        (alias (;instance;) 0 "load" (func (;0;)))
        (alias (;instance;) 1 "store" (func (;1;)))
        (export "load from module 0" (func 0))
        (export "store into module 1" (func 1))
      )`
      const adapterModule = transformer(wat)
      expect(adapterModule).toEqual({
        kind: 'adapter module',
        modules: [
          {
            kind: 'module',
            source: `(module (;0;)
          (memory (;0;) 1)
          (export "mem" (memory 0))
          (func (;0;) (result (;0;) i32)
            (i32.const (;address;) 0)
            (i32.load)
          )
          (export "load" (func 0))
        )`,
          },
          {
            kind: 'module',
            source: `(module (;1;)
          (import "imp" "mem" (memory 1))
          (func (;0;) (param (;0;) i32)
            (i32.const (;address;) 0)
            (local.get (;param;) 0)
            (i32.store)
          )
          (export "store" (func 0))
        )`,
          },
        ],
        imports: {},
        instances: [
          {
            kind: 'module',
            path: ['modules', 0],
            imports: {},
          },
          {
            kind: 'module',
            path: ['modules', 1],
            imports: {
              imp: {
                kind: 'instance',
                path: ['instances', 0],
              },
            },
          },
        ],
        exports: {
          'load from module 0': {
            kind: 'func',
            path: ['instances', 0, 'exports', 'load'],
          },
          'store into module 1': {
            kind: 'func',
            path: ['instances', 1, 'exports', 'store'],
          },
        },
      })
    })
  })
})
