import { sexp, value } from './grammar.js'

describe('matcher', () => {
  describe('sexp', () => {
    test('matching consecutive values', () => {
      const matcher = sexp(value('alice'), value('bob'))
      const result = matcher({
        type: 'sexp',
        value: [
          { type: 'value', value: 'alice' },
          { type: 'value', value: 'bob' },
        ],
      })
      expect(result).toEqual({
        matched: true,
        value: ['alice', 'bob'],
        result: {
          type: { matched: true, value: 'sexp' },
          value: {
            matched: true,
            value: ['alice', 'bob'],
            result: [
              {
                matched: true,
                value: 'alice',
                result: {
                  type: { matched: true, value: 'value' },
                  value: { matched: true, value: 'alice' },
                },
              },
              {
                matched: true,
                value: 'bob',
                result: {
                  type: { matched: true, value: 'value' },
                  value: { matched: true, value: 'bob' },
                },
              },
            ],
          },
          rest: {
            matched: true,
            value: {},
          },
        },
      })
    })

    test('not matching missing value', () => {
      const matcher = sexp(value('alice'), value('bob'))
      const result = matcher({
        type: 'sexp',
        value: [{ type: 'value', value: 'alice' }],
      })
      expect(result.matched).toBe(false)
    })

    test('not matching extra value', () => {
      const matcher = sexp(value('alice'))
      const result = matcher({
        type: 'sexp',
        value: [
          { type: 'value', value: 'alice' },
          { type: 'value', value: 'eve' },
        ],
      })
      expect(result.matched).toBe(false)
    })

    test('not matching different value', () => {
      const matcher = sexp(value('alice'))
      const result = matcher({
        type: 'sexp',
        value: [{ type: 'value', value: 'eve' }],
      })
      expect(result.matched).toBe(false)
    })

    test('not matching any value to empty sexp', () => {
      const matcher = sexp(value())
      const result = matcher({
        type: 'sexp',
        value: [],
      })
      expect(result.matched).toBe(false)
    })
  })
})
