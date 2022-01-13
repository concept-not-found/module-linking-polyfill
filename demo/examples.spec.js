import Wabt from 'wabt'
import Index from './index.js'
import examples from './examples.js'

const FakeConsole = () => {
  const lines = []
  return {
    log(...messages) {
      lines.push(`${messages.join(' ')}\n`)
    },
    output() {
      return lines.join('')
    },
  }
}
describe('demo', () => {
  describe('examples', () => {
    test.each(examples)(
      '$name',
      async ({ watSource, jsSource, expectedJsConsole }) => {
        const fakeConsole = FakeConsole()
        const { transformWat, execJs } = Index(await Wabt(), fakeConsole)

        const config = transformWat(watSource)
        execJs(jsSource, config)
        expect(expectedJsConsole).toBe(fakeConsole.output())
      }
    )
  })
})
