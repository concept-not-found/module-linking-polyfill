import { jest } from '@jest/globals'

import { sexp, maybe, value } from './grammar.js'

import Parser from './index.js'

describe('matcher', () => {
  describe('sexp', () => {
    test('matching consecutive values', () => {
      const matcher = sexp(value('alice'), value('bob'))
      const wat = '(alice bob)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
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
      })
    })

    test('not matching missing value', () => {
      const matcher = sexp(value('alice'), value('bob'))
      const wat = '(alice)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: false,
      })
    })

    test('not matching extra value', () => {
      const matcher = sexp(value('alice'))
      const wat = '(alice eve)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: false,
      })
    })

    test('not matching different value', () => {
      const matcher = sexp(value('alice'))
      const wat = '(eve)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: false,
      })
    })

    test('matching maybe any value to empty sexp', () => {
      const matcher = sexp(maybe(value(() => true)))
      const wat = '()'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
        value: [{ match: 'maybe', value: [] }],
      })
    })

    test('not matching any value to empty sexp', () => {
      const matcher = sexp(value(() => true))
      const wat = '()'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: false,
      })
    })

    test('build returns array of matched values', () => {
      const matcher = sexp(value('alice'), value('bob'))
      const wat = '(alice bob)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result.build()).toEqual(['alice', 'bob'])
    })

    test('build can be overwritten with builder', () => {
      const matcher = sexp(value('alice'), value('bob'))
      matcher.builder = () => 'built'
      const wat = '(alice bob)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result.build()).toEqual('built')
    })

    test('failures can be logged', () => {
      const matcher = sexp(value('alice'), value('bob'))
      matcher.logger = jest.fn()
      const wat = '(alice)'
      const parser = Parser()
      const input = parser(wat)
      matcher(input)
      expect(matcher.logger).toHaveBeenNthCalledWith(
        1,
        'sexp(value("alice"), value("bob")) failed to match [alice]',
        {
          expected: ['value("alice")', 'value("bob")'],
          input: ['alice'],
          unmatchedExpected: 'value("bob")',
          matched: [{ match: 'value', value: ['alice'] }],
          unmatched: [],
        }
      )
    })

    test('stringifies with expected values', () => {
      expect(String(sexp(value('alice'), value('bob')))).toEqual(
        'sexp(value("alice"), value("bob"))'
      )
    })
  })
})
