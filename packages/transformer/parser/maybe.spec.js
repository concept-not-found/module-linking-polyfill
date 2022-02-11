import { sexp, maybe, seq, value } from './grammar.js'

import Parser from './index.js'

describe('matcher', () => {
  describe('maybe', () => {
    test('matching present value in sexp', () => {
      const matcher = sexp(maybe(value('module')))
      const wat = '(module)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
        value: [
          {
            match: 'maybe',
            value: [
              {
                match: 'value',
                value: ['module'],
              },
            ],
          },
        ],
      })
    })

    test('matching maybe seq of two items', () => {
      const matcher = sexp(
        maybe(seq(value('alice'), value('bob'))),
        value('eve')
      )
      matcher.logger = console.log
      const wat = '(alice bob eve)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
        value: [
          {
            match: 'maybe',
            value: [
              {
                match: 'seq',
                value: [
                  {
                    match: 'value',
                    value: ['alice'],
                  },
                  {
                    match: 'value',
                    value: ['bob'],
                  },
                ],
              },
            ],
          },
          {
            match: 'value',
            value: ['eve'],
          },
        ],
      })
    })

    test('matching missing maybe seq of two items', () => {
      const matcher = sexp(
        maybe(seq(value('alice'), value('bob'))),
        value('eve')
      )
      matcher.logger = console.log
      const wat = '(eve)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
        value: [
          {
            match: 'maybe',
            value: [],
          },
          {
            match: 'value',
            value: ['eve'],
          },
        ],
      })
    })

    test('matching missing value in sexp', () => {
      const matcher = sexp(maybe(value('alice')), value('bob'))
      const wat = '(bob)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
        value: [
          {
            match: 'maybe',
            value: [],
          },
          {
            match: 'value',
            value: ['bob'],
          },
        ],
      })
    })

    test('matching any value to empty sexp', () => {
      const matcher = sexp(maybe(value(() => true)))
      const wat = '()'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
        value: [
          {
            match: 'maybe',
            value: [],
          },
        ],
      })
    })

    test('build returns matched present value', () => {
      const matcher = sexp(maybe(value('module')))
      const wat = '(module)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result.value[0].build()).toEqual('module')
    })

    test('build returns nothing for missing value', () => {
      const matcher = sexp(maybe(value('module')))
      const wat = '()'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result.value[0].build()).toEqual(undefined)
    })

    test('build can be overwritten with builder', () => {
      const maybeMatcher = maybe(value('module'))
      maybeMatcher.builder = () => 'built'
      const matcher = sexp(maybeMatcher)
      const wat = '(module)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result.value[0].build()).toEqual('built')
    })

    test('stringifies with expected value', () => {
      expect(String(maybe(value('module')))).toEqual('maybe(value("module"))')
    })
  })
})
