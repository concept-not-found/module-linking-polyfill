import transformer from '../index.js'

describe('adapter-module-transformer', () => {
  describe('export', () => {
    test('export module func', () => {
      const adapterModule = `(adapter module (;0;)
        (module (;1;)
          (func (;0;) (result i32)
            (i32.const 42)
          )
          (export "answer" (func 0))
        )
        (instance (;0;) (instantiate (;module;) 1))
        (alias (;instance;) 0 "answer" (func (;0;)))
        (export "exported_answer" (func 0))
      )`
      const { modules, imports, instances, exports } =
        transformer(adapterModule)
      expect(modules).toMatchObject([
        {
          index: 1,
          source: `(module (;1;)
          (func (;0;) (result i32)
            (i32.const 42)
          )
          (export "answer" (func 0))
        )`,
        },
      ])
      expect(imports).toMatchObject({})
      expect(instances).toMatchObject([
        {
          type: 'module',
          path: ['modules', 0],
        },
      ])
      expect(exports).toMatchObject({
        exported_answer: {
          kind: 'func',
          path: ['instances', 0, 'exports', 'answer'],
        },
      })
    })

    test('export module', () => {
      const adapterModule = `(adapter module (;0;)
        (module (;1;))
        (export "Y" (module 1))
      )`
      const { modules, imports, instances, exports } =
        transformer(adapterModule)
      expect(modules).toMatchObject([
        {
          index: 1,
          source: `(module (;1;))`,
        },
      ])
      expect(imports).toMatchObject({})
      expect(instances).toMatchObject([])
      expect(exports).toMatchObject({
        Y: {
          kind: 'module',
          path: ['modules', 0],
        },
      })
    })

    test('export module instance', () => {
      const adapterModule = `(adapter module (;0;)
        (module (;1;))
        (instance (;0;) (instantiate (;module;) 1))
        (export "Y" (instance 0))
      )`
      const { modules, imports, instances, exports } =
        transformer(adapterModule)
      expect(modules).toMatchObject([
        {
          index: 1,
          source: `(module (;1;))`,
        },
      ])
      expect(imports).toMatchObject({})
      expect(instances).toMatchObject([
        {
          index: 0,
          type: 'module',
          path: ['modules', 0],
        },
      ])
      expect(exports).toMatchObject({
        Y: {
          kind: 'instance',
          path: ['instances', 0],
        },
      })
    })
  })
})
