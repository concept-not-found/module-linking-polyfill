import dedent from '../dedent.js'
import transformer from '../index.js'

describe('adapter-module-transformer', () => {
  describe('alias', () => {
    describe('instance export', () => {
      test.each([
        {
          form: 'alias first',
          wat: dedent`
            (adapter module
              (import "imp" (instance $i
                (export "inner-exp" (func))
              ))
              (alias $i "inner-exp" (func $f))
              (export "exp" (func $f))
            )
          `,
        },
      ])('$form', ({ wat }) => {
        const adapterModule = transformer(wat)
        expect(adapterModule).toEqual({
          kind: 'adapter module',
          modules: [],
          imports: {
            imp: {
              kind: 'instance',
              exports: {
                'inner-exp': {
                  kind: 'func',
                },
              },
            },
          },
          instances: [
            {
              kind: 'instance',
              path: ['imports', 'imp'],
              exports: {
                'inner-exp': {
                  kind: 'func',
                },
              },
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

    describe('outer', () => {
      test.each([
        {
          form: 'alias first',
          wat: dedent`
            (adapter module $M
              (import "imp" (func $f))
              (adapter module $N
                (alias $M $f (func $g))
                (export "inner-exp" (func $g))
              )
              (export "exp" (module $N))
            )
          `,
        },
      ])('$form', ({ wat }) => {
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
          instances: [],
          exports: {
            exp: {
              kind: 'module',
              path: ['modules', 0],
            },
          },
        })
      })
    })
  })
})
