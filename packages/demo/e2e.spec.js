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
        (adapter module $M
          (adapter module $MM
            (adapter module $MMM
              (func $fff (alias $MM $ff))
              (export "inner-inner-exp" (func $fff))
            )
            (func $ff (alias $M $f))
            (instance $ii (instantiate $MMM))
            (func $gg (alias $ii "inner-inner-exp"))
            (export "inner-exp" (func $gg))
            )
          (func $f (import "imp") (result i32))
          (instance $i (instantiate $MM))
          (func $g (alias $i "inner-exp"))
          (export "exp" (func $g))
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
