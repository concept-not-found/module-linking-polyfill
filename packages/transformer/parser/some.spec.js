import { jest } from '@jest/globals'
import { assertMatched } from './grammar-test-utils.js'

import { NoMatch, sexp, maybe, some, value } from './grammar.js'

import Parser from './index.js'

describe('matcher', () => {
  describe('some', () => {
    test('matching consecutive values', () => {
      const matcher = sexp(some(value('alice')))
      const wat = '(alice alice)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
        value: [
          {
            match: 'some',
            value: [
              {
                match: 'value',
                value: ['alice'],
              },
              {
                match: 'value',
                value: ['alice'],
              },
            ],
          },
        ],
      })
    })

    test('matching consecutive values until different', () => {
      const matcher = sexp(some(value('alice')), value('bob'), value('alice'))
      const wat = '(alice alice bob alice)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
        value: [
          {
            match: 'some',
            value: [
              {
                match: 'value',
                value: ['alice'],
              },
              {
                match: 'value',
                value: ['alice'],
              },
            ],
          },
          {
            match: 'value',
            value: ['bob'],
          },
          {
            match: 'value',
            value: ['alice'],
          },
        ],
      })
    })

    test('matching pair of values until different', () => {
      const matcher = sexp(
        some(sexp(value('alice'), value('bob'))),
        value('alice')
      )
      const wat = '((alice bob) alice)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
        value: [
          {
            match: 'some',
            value: [
              {
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
              },
            ],
          },
          {
            match: 'value',
            value: ['alice'],
          },
        ],
      })
    })

    test('not matching different value', () => {
      const matcher = sexp(some(value('alice')))
      const wat = '(bob)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual(NoMatch)
    })

    test('not matching no values', () => {
      const matcher = sexp(some(value('alice')))
      const wat = '()'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual(NoMatch)
    })

    test('always fails to match empty sexp even if expected is a maybe', () => {
      const matcher = sexp(some(maybe(value(() => true))))
      const wat = '()'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual(NoMatch)
    })

    test('build returns array of matched values', () => {
      const matcher = sexp(some(value('alice')))
      const wat = '(alice alice)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      assertMatched(result)
      expect(result.value[0].build()).toEqual(['alice', 'alice'])
    })

    test('build can be overwritten with builder', () => {
      const someMatcher = some(value('alice'))
      someMatcher.builder = () => 'built'
      const matcher = sexp(someMatcher)
      const wat = '(alice alice)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      assertMatched(result)
      expect(result.value[0].build()).toEqual('built')
    })

    test('failures can be logged', () => {
      const someMatcher = some(value('alice'))
      someMatcher.logger = jest.fn()
      const matcher = sexp(someMatcher)
      const wat = '(eve)'
      const parser = Parser()
      const input = parser(wat)
      matcher(input)
      expect(someMatcher.logger).toHaveBeenNthCalledWith(
        1,
        'some(value("alice")) failed to match [eve]',
        {
          expected: 'value("alice")',
          input: ['eve'],
        }
      )
    })

    test('stringifies with expected value', () => {
      expect(String(some(value('alice')))).toEqual('some(value("alice"))')
    })
  })
})
