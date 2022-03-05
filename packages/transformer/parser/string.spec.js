import { matchPredicate } from 'patcom'
import { string } from './grammar.js'

describe('matcher', () => {
  describe('string', () => {
    test('matching string in sexp', () => {
      const matcher = string('module')
      const result = matcher({ type: 'string', value: 'module' })
      expect(result).toEqual({
        matched: true,
        value: 'module',
        result: {
          type: { matched: true, value: 'string' },
          value: { matched: true, value: 'module' },
        },
      })
    })

    test('not matching different string in sexp', () => {
      const matcher = string('module')
      const result = matcher({ type: 'string', value: 'alice' })
      expect(result.matched).toBe(false)
    })

    test('not matching value in sexp', () => {
      const matcher = string('module')
      const result = matcher({ type: 'value', value: 'module' })
      expect(result.matched).toBe(false)
    })

    test('expected can be a predicate function', () => {
      const matcher = string(matchPredicate((value) => value.startsWith('m')))

      expect(matcher({ type: 'string', value: 'module' }).matched).toBe(true)
      expect(matcher({ type: 'string', value: 'alice' }).matched).toBe(false)
    })
  })
})
