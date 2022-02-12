import { jest } from '@jest/globals'
import { assertMatched } from './grammar-test-utils.js'

import { NoMatch, sexp, one, maybe, value } from './grammar.js'

import Parser from './index.js'

describe('matcher', () => {
  describe('one', () => {
    test('matching first one', () => {
      const matcher = sexp(one(value('alice'), value('bob')))
      const wat = '(alice)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
        value: [
          {
            match: 'one',
            value: [
              {
                match: 'value',
                value: ['alice'],
              },
            ],
          },
        ],
      })
    })

    test('matching second one', () => {
      const matcher = sexp(one(value('alice'), value('bob')))
      const wat = '(bob)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
        value: [
          {
            match: 'one',
            value: [
              {
                match: 'value',
                value: ['bob'],
              },
            ],
          },
        ],
      })
    })

    test('not matching when all do not match', () => {
      const matcher = sexp(one(value('alice'), value('bob')))
      const wat = '(eve)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual(NoMatch)
    })

    test('matching maybe any value to empty sexp', () => {
      const matcher = sexp(one(maybe(value(() => true))))
      const wat = '()'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
        value: [
          {
            match: 'one',
            value: [{ match: 'maybe', value: [] }],
          },
        ],
      })
    })

    test('not matching any value to empty sexp', () => {
      const matcher = sexp(one(value(() => true)))
      const wat = '()'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual(NoMatch)
    })

    test('build returns matched value', () => {
      const matcher = sexp(one(value('alice'), value('bob')))
      const wat = '(bob)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      assertMatched(result)
      expect(result.value[0].build()).toEqual('bob')
    })

    test('build can be overwritten with builder', () => {
      const oneMatcher = one(value('alice'), value('bob'))
      oneMatcher.builder = () => 'built'
      const matcher = sexp(oneMatcher)
      const wat = '(bob)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      assertMatched(result)
      expect(result.value[0].build()).toEqual('built')
    })

    test('failures can be logged', () => {
      const oneMatcher = one(value('alice'), value('bob'))
      oneMatcher.logger = jest.fn()
      const matcher = sexp(oneMatcher)
      const wat = '(eve)'
      const parser = Parser()
      const input = parser(wat)
      matcher(input)
      expect(oneMatcher.logger).toHaveBeenNthCalledWith(
        1,
        'one(value("alice"), value("bob")) failed to match eve',
        {
          expected: ['value("alice")', 'value("bob")'],
          input: ['eve'],
        }
      )
    })

    test('stringifies with expected value', () => {
      expect(String(one(value('alice'), value('bob')))).toEqual(
        'one(value("alice"), value("bob"))'
      )
    })
  })
})
