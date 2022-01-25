import Wabt from 'wabt'
import dedent from 'dedent'
import transformer from './node_modules/@concept-not-found/module-linking-polyfill-transformer/index.js'
import runtime from './node_modules/@concept-not-found/module-linking-polyfill-runtime/index.js'
import Index from './index.js'
import Examples from './examples.js'

describe('demo', () => {
  describe('examples', () => {
    test.each(Examples(dedent))(
      '$name',
      async ({ watSource, jsSource, expectedJsConsole }) => {
        const { transformWat, execJs } = Index(
          await Wabt(),
          transformer,
          runtime
        )

        const config = transformWat(watSource)
        const consoleOutput = execJs(jsSource, config)
        expect(consoleOutput.trim()).toBe(expectedJsConsole)
      }
    )
  })

  const scenarios = [
    {
      name: 'chained outer alias',
      watSource: dedent`
        (adapter module (;0;)
          (import "imp" (func (;0;) (result i32)))
          (adapter module (;0;)
            (adapter module (;0;)
              (alias (;outer;) 1 (;func;) 0 (func (;0;)))
              (export "inner-inner-exp" (func 0))
            )
            (alias (;outer;) 1 (;func;) 0 (func (;0;)))
            (instance (;0;) (instantiate (;module;) 0))
            (alias (;instance;) 0 "inner-inner-exp" (func (;1;)))
            (export "inner-exp" (func 1))
          )
          (instance (;0;) (instantiate (;module;) 0))
          (alias (;instance;) 0 "inner-exp" (func (;1;)))
          (export "exp" (func 1))
        )
      `,
      jsSource: dedent`
        const imports = {
          imp() {
            return 42
          }
        }
        const {exports: {exp}} = moduleLinkingPolyfillRuntime(config, imports)
        console.log("exp() ===", exp())
      `,
      expectedJsConsole: dedent`
        exp() === 42
      `,
    },
  ]

  test.each(scenarios)(
    '$name',
    async ({ watSource, jsSource, expectedJsConsole }) => {
      const { transformWat, execJs } = Index(await Wabt(), transformer, runtime)

      const config = transformWat(watSource)
      const consoleOutput = execJs(jsSource, config)
      expect(consoleOutput.trim()).toBe(expectedJsConsole)
    }
  )
})
