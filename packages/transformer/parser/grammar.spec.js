import { maybe, some } from 'patcom'
import { root, sexp, value } from './grammar.js'

import Parser from './index.js'

describe('parser matchers', () => {
  describe('sexp into maybe some', () => {
    test('matches just module', () => {
      const matcher = root(
        sexp(value('module'), maybe(some(sexp(value('func')))))
      )
      const result = matcher({
        type: 'sexp',
        value: [
          {
            type: 'sexp',
            value: [{ type: 'value', value: 'module' }],
          },
        ],
      })
      expect(result).toMatchObject({
        matched: true,
        value: ['module', undefined],
      })
    })

    test('matches one func', () => {
      const matcher = root(
        sexp(value('module'), maybe(some(sexp(value('func')))))
      )
      const wat = `
        (module
          (func)
        )
      `
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result.matched).toBe(true)
    })

    test('matches two func', () => {
      const matcher = root(
        sexp(value('module'), maybe(some(sexp(value('func')))))
      )
      const wat = `
        (module
          (func)
          (func)
        )
      `
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result.matched).toBe(true)
    })
  })
})
