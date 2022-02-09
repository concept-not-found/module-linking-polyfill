import { sexp, value, maybe, some } from './grammar.js'

import Parser from './index.js'

describe('parser matchers', () => {
  describe('sexp into maybe some', () => {
    test('matches just module', () => {
      const matcher = sexp(value('module'), maybe(some(sexp(value('func')))))
      const wat = '(module)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
        value: [
          {
            match: 'value',
            value: ['module'],
          },
          {
            match: 'maybe',
            value: [],
          },
        ],
      })
    })

    test('matches one func', () => {
      const matcher = sexp(value('module'), maybe(some(sexp(value('func')))))
      const wat = `
        (module
          (func)
        )
      `
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
        value: [
          {
            match: 'value',
            value: ['module'],
          },
          {
            match: 'maybe',
            value: [
              {
                match: 'some',
                value: [
                  {
                    match: 'sexp',
                    value: [
                      {
                        match: 'value',
                        value: ['func'],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      })
    })

    test('matches two func', () => {
      const matcher = sexp(value('module'), maybe(some(sexp(value('func')))))
      const wat = `
        (module
          (func)
          (func)
        )
      `
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
        value: [
          {
            match: 'value',
            value: ['module'],
          },
          {
            match: 'maybe',
            value: [
              {
                match: 'some',
                value: [
                  {
                    match: 'sexp',
                    value: [
                      {
                        match: 'value',
                        value: ['func'],
                      },
                    ],
                  },
                  {
                    match: 'sexp',
                    value: [
                      {
                        match: 'value',
                        value: ['func'],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      })
    })
  })
})
