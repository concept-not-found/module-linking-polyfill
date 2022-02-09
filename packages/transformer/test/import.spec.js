import dedent from '../dedent.js'
import onedent from '../onedent.js'
import transformer from '../index.js'

describe('adapter-module-transformer', () => {
  describe('import', () => {
    describe('re-export func', () => {
      test.each([
        {
          form: 'import first',
          wat: dedent`
            (adapter module (;0;)
              (import "imp" (func (;0;)))
              (export "exp" (func 0))
            )
          `,
        },
        {
          form: 'inline import',
          wat: dedent`
            (adapter module (;0;)
              (func (;0;) (import "imp"))
              (export "exp" (func 0))
            )
          `,
        },
      ])('$form', ({ wat }) => {
        const adapterModule = transformer(wat)
        expect(adapterModule).toEqual({
          kind: 'adapter module',
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
    })

    describe('re-export instance', () => {
      test.each([
        {
          form: 'import first',
          wat: dedent`
            (adapter module (;0;)
              (import "imp" (instance (;0;)))
              (export "exp" (instance 0))
            )
          `,
        },
        {
          form: 'inline import',
          wat: dedent`
            (adapter module (;0;)
              (instance (;0;) (import "imp"))
              (export "exp" (instance 0))
            )
          `,
        },
      ])('$form', ({ wat }) => {
        const adapterModule = transformer(wat)
        expect(adapterModule).toEqual({
          kind: 'adapter module',
          modules: [],
          imports: { imp: { kind: 'instance', exports: {} } },
          instances: [
            {
              kind: 'instance',
              path: ['imports', 'imp'],
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
    })

    describe('re-export module', () => {
      test.each([
        {
          form: 'import first',
          wat: dedent`
            (adapter module (;0;)
              (import "imp" (module (;0;)))
              (export "exp" (module 0))
            )
          `,
        },
        {
          form: 'inline import',
          wat: dedent`
            (adapter module (;0;)
              (module (;0;) (import "imp"))
              (export "exp" (module 0))
            )
          `,
        },
      ])('$form', ({ wat }) => {
        const adapterModule = transformer(wat)
        expect(adapterModule).toEqual({
          kind: 'adapter module',
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
    })

    describe('re-export instance func', () => {
      test.each([
        {
          form: 'import first',
          wat: dedent`
            (adapter module (;0;)
              (import "imp" (instance (;0;)
                (export "f" (func (result i32)))
              ))
              (alias (;instance;) 0 "f" (func (;0;)))
              (export "exp" (func 0))
            )
          `,
        },
        {
          form: 'inline import',
          wat: dedent`
            (adapter module (;0;)
              (instance (;0;) (import "imp")
                (export "f" (func (result i32)))
              )
              (func (;0;) (alias (;instance;) 0 "f"))
              (export "exp" (func 0))
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
                f: {
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
    })

    describe('export func from imported module', () => {
      test.each([
        {
          form: 'import first',
          wat: dedent`
            (adapter module (;0;)
              (import "imp" (module (;0;)
                (export "f" (func))
              ))
              (instance (;0;) (instantiate (;module;) 0))
              (alias (;instance;) 0 "f" (func (;0;)))
              (export "exp" (func 0))
            )
          `,
        },
        {
          form: 'inline import',
          wat: dedent`
            (adapter module (;0;)
              (module (;0;) (import "imp")
                (export "f" (func))
              )
              (instance (;0;) (instantiate (;module;) 0))
              (func (;0;) (alias (;instance;) 0 "f"))
              (export "exp" (func 0))
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
              kind: 'module',
              modulePath: ['imports', 'imp'],
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
    })

    describe('re-export func through instance', () => {
      test.each([
        {
          form: 'import first',
          wat: dedent`
            (adapter module (;0;)
              (import "imp" (func (;0;)))
              (instance (;0;)
                (export "f" (func 0))
              )
              (alias (;instance;) 0 "f" (func (;1;)))
              (export "exp" (func 1))
            )
          `,
        },
        {
          form: 'inline import',
          wat: dedent`
            (adapter module (;0;)
              (func (;0;) (import "imp"))
              (instance (;0;)
                (export "f" (func 0))
              )
              (func (;1;) (alias (;instance;) 0 "f"))
              (export "exp" (func 1))
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
              kind: 'func',
              kindType: [],
            },
          },
          instances: [
            {
              kind: 'instance',
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
    })

    describe('re-export func through module', () => {
      test.each([
        {
          form: 'import first',
          wat: dedent`
            (adapter module (;0;)
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
            )
          `,
          expectedSource: onedent`
            (module (;0;)
              (import "mimp" "f" (func (;0;)))
              (export "mexp" (func 0))
            )
          `,
        },
        {
          form: 'inline import',
          wat: dedent`
            (adapter module (;0;)
              (module (;0;)
                (func (;0;) (import "mimp" "f"))
                (export "mexp" (func 0))
              )
              (func (;0;) (import "f"))
              (instance (;0;)
                (export "f" (func 0))
              )
              (instance (;1;) (instantiate (;module;) 0
                (import "mimp" (instance 0))
              ))
              (func (;1;) (alias (;instance;) 1 "mexp"))
              (export "exp" (func 1))
            )
          `,
          expectedSource: onedent`
            (module (;0;)
              (func (;0;) (import "mimp" "f"))
              (export "mexp" (func 0))
            )
          `,
        },
      ])('$form', ({ wat, expectedSource }) => {
        const adapterModule = transformer(wat)
        expect(adapterModule).toEqual({
          kind: 'adapter module',
          modules: [
            {
              kind: 'module',
              source: expectedSource,
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
              kind: 'instance',
              exports: {
                f: {
                  kind: 'func',
                  path: ['imports', 'f'],
                },
              },
            },
            {
              kind: 'module',
              modulePath: ['modules', 0],
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
    })

    describe('interleave and re-export funcs', () => {
      test.each([
        {
          form: 'import first',
          wat: dedent`
            (adapter module
              (import "A" (func))
              (import "B" (func))
              (export "X" (func 1))
              (export "Y" (func 0))
            )
          `,
        },
        {
          form: 'inline import',
          wat: dedent`
            (adapter module
              (func (import "A"))
              (func (import "B"))
              (export "X" (func 1))
              (export "Y" (func 0))
            )
          `,
        },
      ])('$form', ({ wat }) => {
        const adapterModule = transformer(wat)
        expect(adapterModule).toEqual({
          kind: 'adapter module',
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
})
