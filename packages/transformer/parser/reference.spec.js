import { sexp, reference, value } from './grammar.js'

describe('matcher', () => {
  describe('reference', () => {
    test('reference passes through expected', () => {
      const valueReference = reference()
      const matcher = sexp(valueReference)
      valueReference.matcher = value('module')
      const result = matcher({
        type: 'sexp',
        value: [{ type: 'value', value: 'module' }],
      })
      expect(result.matched).toBe(true)
    })

    test('throws attempting to be used before value is set', () => {
      const valueReference = reference()
      const matcher = sexp(valueReference)
      expect(() =>
        matcher({
          type: 'sexp',
          value: [{ type: 'value', value: 'module' }],
        })
      ).toThrow()
    })
  })
})
