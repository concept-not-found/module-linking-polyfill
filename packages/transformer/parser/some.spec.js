import { some } from 'patcom'

import { sexp, value } from './grammar.js'

describe('matcher', () => {
  describe('some', () => {
    test('matching consecutive values', () => {
      const matcher = sexp(some(value('alice')))
      const result = matcher({
        type: 'sexp',
        value: [
          { type: 'value', value: 'alice' },
          { type: 'value', value: 'alice' },
        ],
      })
      expect(result.matched).toBe(true)
    })

    test('matching consecutive values until different', () => {
      const matcher = sexp(some(value('alice')), value('bob'), value('alice'))
      const result = matcher({
        type: 'sexp',
        value: [
          { type: 'value', value: 'alice' },
          { type: 'value', value: 'alice' },
          { type: 'value', value: 'bob' },
          { type: 'value', value: 'alice' },
        ],
      })
      expect(result.matched).toBe(true)
    })

    test('matching pair of values until different', () => {
      const matcher = sexp(
        some(sexp(value('alice'), value('bob'))),
        value('alice')
      )
      const result = matcher({
        type: 'sexp',
        value: [
          {
            type: 'sexp',
            value: [
              { type: 'value', value: 'alice' },
              { type: 'value', value: 'bob' },
            ],
          },
          { type: 'value', value: 'alice' },
        ],
      })
      expect(result.matched).toBe(true)
    })

    test('not matching different value', () => {
      const matcher = sexp(some(value('alice')))
      const result = matcher({
        type: 'sexp',
        value: [{ type: 'value', value: 'bob' }],
      })
      expect(result.matched).toBe(false)
    })

    test('not matching no values', () => {
      const matcher = sexp(some(value('alice')))
      const result = matcher({
        type: 'sexp',
        value: [],
      })
      expect(result.matched).toBe(false)
    })
  })
})
