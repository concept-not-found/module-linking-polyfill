import { jest } from '@jest/globals'
import { assertMatched } from './grammar-test-utils.js'

import { NoMatch, sexp, value } from './grammar.js'

import Parser from './index.js'

describe('matcher', () => {
  describe('value', () => {
    test('matching value in sexp', () => {
      const matcher = sexp(value('module'))
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
        ],
      })
    })

    test('not matching different value in sexp', () => {
      const matcher = sexp(value('module'))
      const wat = '(alice)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual(NoMatch)
    })

    test('not matching string in sexp', () => {
      const matcher = sexp(value('module'))
      const wat = '("module")'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual(NoMatch)
    })

    test('expected can be a predicate function', () => {
      const matcher = sexp(value((value) => value.startsWith('m')))

      const parser = Parser()

      expect(matcher(parser('(module)')).match).toBeTruthy()
      expect(matcher(parser('(alice)')).match).toBeFalsy()
    })

    test('not matching any value to empty sexp', () => {
      const matcher = sexp(value(() => true))
      const wat = '()'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual(NoMatch)
    })

    test('build returns matched value', () => {
      const matcher = sexp(value('module'))
      const wat = '(module)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      assertMatched(result)
      expect(result.value[0].build()).toEqual('module')
    })

    test('build can be overwritten with builder', () => {
      const valueMatcher = value('module')
      valueMatcher.builder = () => 'built'
      const matcher = sexp(valueMatcher)
      const wat = '(module)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      assertMatched(result)
      expect(result.value[0].build()).toEqual('built')
    })

    test('failures can be logged', () => {
      const valueMatcher = value('module')
      valueMatcher.logger = jest.fn()
      const matcher = sexp(valueMatcher)
      const wat = '("alice")'
      const parser = Parser()
      const input = parser(wat)
      matcher(input)
      expect(valueMatcher.logger).toHaveBeenNthCalledWith(
        1,
        'value("module") failed to match [alice]',
        {
          typeOf: 'string',
          expected: 'module',
          input: ['alice'],
        }
      )
    })

    test('stringifies with expected value', () => {
      expect(String(value('module'))).toEqual('value("module")')
    })
  })
})
