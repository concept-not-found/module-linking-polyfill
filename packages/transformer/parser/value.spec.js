import { matchPredicate } from 'patcom'
import { value } from './grammar.js'

describe('matcher', () => {
  describe('value', () => {
    test('matching value in sexp', () => {
      const matcher = value('module')
      const result = matcher({ type: 'value', value: 'module' })
      expect(result).toEqual({
        matched: true,
        value: 'module',
        result: {
          type: { matched: true, value: 'value' },
          value: { matched: true, value: 'module' },
        },
      })
    })

    test('not matching different value in sexp', () => {
      const matcher = value('module')
      const result = matcher({ type: 'value', value: 'alice' })
      expect(result.matched).toBe(false)
    })

    test('not matching string in sexp', () => {
      const matcher = value('module')
      const result = matcher({ type: 'string', value: 'module' })
      expect(result.matched).toBe(false)
    })

    test('expected can be a predicate function', () => {
      const matcher = value(matchPredicate((value) => value.startsWith('m')))

      expect(matcher({ type: 'value', value: 'module' }).matched).toBe(true)
      expect(matcher({ type: 'value', value: 'alice' }).matched).toBe(false)
    })
  })
})
