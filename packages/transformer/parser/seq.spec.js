import { jest } from '@jest/globals'
import { assertMatched } from './grammar-test-utils.js'

import { NoMatch, sexp, seq, maybe, value } from './grammar.js'

import Parser from './index.js'

describe('matcher', () => {
  describe('seq', () => {
    test('matching consecutive values', () => {
      const matcher = sexp(seq(value('alice'), value('bob')))
      const wat = '(alice bob)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
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
      })
    })

    test('not matching missing value', () => {
      const matcher = sexp(seq(value('alice'), value('bob')))
      const wat = '(alice)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual(NoMatch)
    })

    test('not matching different values', () => {
      const matcher = sexp(seq(value('alice'), value('bob')))
      const wat = '(alice eve)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual(NoMatch)
    })

    test('matching maybe any value to empty sexp', () => {
      const matcher = sexp(seq(maybe(value(() => true))))
      const wat = '()'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
        value: [
          {
            match: 'seq',
            value: [{ match: 'maybe', value: [] }],
          },
        ],
      })
    })

    test('not matching any value to empty sexp', () => {
      const matcher = sexp(seq(value(() => true)))
      const wat = '()'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual(NoMatch)
    })

    test('build returns array of matched values', () => {
      const matcher = sexp(seq(value('alice'), value('bob')))
      const wat = '(alice bob)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      assertMatched(result)
      expect(result.value[0].build()).toEqual(['alice', 'bob'])
    })

    test('build can be overwritten with builder', () => {
      const seqMatcher = seq(value('alice'), value('bob'))
      seqMatcher.builder = () => 'built'
      const matcher = sexp(seqMatcher)
      const wat = '(alice bob)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      assertMatched(result)
      expect(result.value[0].build()).toEqual('built')
    })

    test('failures can be logged', () => {
      const seqMatcher = seq(value('alice'), value('bob'))
      seqMatcher.logger = jest.fn()
      const matcher = sexp(seqMatcher)
      const wat = '(alice)'
      const parser = Parser()
      const input = parser(wat)
      matcher(input)
      expect(seqMatcher.logger).toHaveBeenNthCalledWith(
        1,
        'seq(value("alice"), value("bob")) failed to match [alice]',
        {
          expected: ['value("alice")', 'value("bob")'],
          input: ['alice'],
          unmatchedExpected: 'value("bob")',
          matched: [{ match: 'value', value: ['alice'] }],
          unmatched: [],
        }
      )
    })

    test('stringifies with expected value', () => {
      expect(String(seq(value('alice'), value('bob')))).toEqual(
        'seq(value("alice"), value("bob"))'
      )
    })
  })
})
