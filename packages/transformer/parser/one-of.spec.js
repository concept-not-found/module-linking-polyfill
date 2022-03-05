import { oneOf } from 'patcom'

import { sexp, value } from './grammar.js'

describe('matcher', () => {
  describe('oneOf', () => {
    test('matching first one', () => {
      const matcher = sexp(oneOf(value('alice'), value('bob')))
      const result = matcher({
        type: 'sexp',
        value: [{ type: 'value', value: 'alice' }],
      })
      expect(result.matched).toBe(true)
    })

    test('matching second one', () => {
      const matcher = sexp(oneOf(value('alice'), value('bob')))
      const result = matcher({
        type: 'sexp',
        value: [{ type: 'value', value: 'bob' }],
      })
      expect(result.matched).toBe(true)
    })

    test('not matching when all do not match', () => {
      const matcher = sexp(oneOf(value('alice'), value('bob')))
      const result = matcher({
        type: 'sexp',
        value: [{ type: 'value', value: 'eve' }],
      })
      expect(result.matched).toBe(false)
    })

    test('not matching any value to empty sexp', () => {
      const matcher = sexp(oneOf(value()))
      const result = matcher({
        type: 'sexp',
        value: [],
      })
      expect(result.matched).toBe(false)
    })
  })
})
