import Wabt from 'wabt'
import Index from './index.js'
import examples from './examples.js'

describe('demo', () => {
  describe('examples', () => {
    test.each(examples)(
      '$name',
      async ({ watSource, jsSource, expectedJsConsole }) => {
        const { transformWat, execJs } = Index(await Wabt())

        const config = transformWat(watSource)
        const consoleOutput = execJs(jsSource, config)
        expect(consoleOutput).toBe(expectedJsConsole)
      }
    )
  })
})
