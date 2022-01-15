import transformer from '../index.js'

describe('adapter-module-transformer', () => {
  describe('nested', () => {
    test('nested empty adapter module', () => {
      const wat = `(adapter module (;0;)
        (adapter module (;0;))
      )`
      const adapterModule = transformer(wat)
      expect(adapterModule).toEqual({
        kind: 'adapter module',
        modules: [
          {
            kind: 'adapter module',
            modules: [],
            imports: {},
            instances: [],
            exports: {},
          },
        ],
        imports: {},
        instances: [],
        exports: {},
      })
    })

    test('nested nested empty adapter module', () => {
      const wat = `(adapter module (;0;)
        (adapter module (;0;)
          (adapter module (;0;))
        )
      )`
      const adapterModule = transformer(wat)
      expect(adapterModule).toEqual({
        kind: 'adapter module',
        modules: [
          {
            kind: 'adapter module',
            modules: [
              {
                kind: 'adapter module',
                modules: [],
                imports: {},
                instances: [],
                exports: {},
              },
            ],
            imports: {},
            instances: [],
            exports: {},
          },
        ],
        imports: {},
        instances: [],
        exports: {},
      })
    })

    test('re-export func via inner module', () => {
      const wat = `(adapter module (;0;)
        (import "imp" (func))
        (adapter module (;0;)
          (alias (;outer;) 1 (;func;) 0 (func (;0;)))
          (export "inner-exp" (func 0))
        )
        (instance (;0;) (instantiate (;module;) 0))
        (alias (;instance;) 0 "inner-exp" (func (;1;)))
        (export "exp" (func 1))
      )`
      const adapterModule = transformer(wat)
      expect(adapterModule).toEqual({
        kind: 'adapter module',
        modules: [
          {
            kind: 'adapter module',
            modules: [],
            imports: {},
            instances: [],
            exports: {
              'inner-exp': {
                kind: 'func',
                path: ['..', 'imports', 'imp'],
              },
            },
          },
        ],
        imports: {
          imp: {
            kind: 'func',
            kindType: [],
          },
        },
        instances: [
          {
            kind: 'module',
            path: ['modules', 0],
            imports: {},
          },
        ],
        exports: {
          exp: {
            kind: 'func',
            path: ['instances', 0, 'exports', 'inner-exp'],
          },
        },
      })
    })
  })
})
