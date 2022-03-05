import { maybe, group } from 'patcom'

import { sexp, value } from './grammar.js'

describe('matcher', () => {
  describe('maybe', () => {
    test('matching present value in sexp', () => {
      const matcher = sexp(maybe(value('module')))
      const result = matcher({
        type: 'sexp',
        value: [{ type: 'value', value: 'module' }],
      })
      expect(result.matched).toBe(true)
    })

    test('matching maybe group of two items', () => {
      const matcher = sexp(
        maybe(group(value('alice'), value('bob'))),
        value('eve')
      )
      const result = matcher({
        type: 'sexp',
        value: [
          { type: 'value', value: 'alice' },
          { type: 'value', value: 'bob' },
          { type: 'value', value: 'eve' },
        ],
      })
      expect(result.matched).toBe(true)
    })

    test('matching missing maybe group of two items', () => {
      const matcher = sexp(
        maybe(group(value('alice'), value('bob'))),
        value('eve')
      )
      const result = matcher({
        type: 'sexp',
        value: [{ type: 'value', value: 'eve' }],
      })
      expect(result.matched).toBe(true)
    })

    test('matching missing value in sexp', () => {
      const matcher = sexp(maybe(value('alice')), value('bob'))
      const result = matcher({
        type: 'sexp',
        value: [{ type: 'value', value: 'bob' }],
      })
      expect(result.matched).toBe(true)
    })

    test('matching any value to empty sexp', () => {
      const matcher = sexp(maybe(value()))
      const result = matcher({
        type: 'sexp',
        value: [],
      })
      expect(result.matched).toBe(true)
    })
  })
})
