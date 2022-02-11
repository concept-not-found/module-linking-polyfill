import { jest } from '@jest/globals'
import { assertMatched } from './grammar-test-utils.js'

import { sexp, string } from './grammar.js'

import Parser from './index.js'

describe('matcher', () => {
  describe('string', () => {
    test('matching string in sexp', () => {
      const matcher = sexp(string('module'))
      const wat = '("module")'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
        value: [
          {
            match: 'string',
            value: ['module'],
          },
        ],
      })
    })

    test('not matching different string in sexp', () => {
      const matcher = sexp(string('module'))
      const wat = '("alice")'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: false,
      })
    })

    test('not matching value in sexp', () => {
      const matcher = sexp(string('module'))
      const wat = '(module)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: false,
      })
    })

    test('expected can be a predicate function', () => {
      const matcher = sexp(string((value) => value.startsWith('m')))

      const parser = Parser()

      expect(matcher(parser('("module")')).match).toBeTruthy()
      expect(matcher(parser('("alice")')).match).toBeFalsy()
    })

    test('not matching any value to empty sexp', () => {
      const matcher = sexp(string(() => true))
      const wat = '()'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: false,
      })
    })

    test('build returns matched string', () => {
      const matcher = sexp(string('module'))
      const wat = '("module")'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      assertMatched(result)
      expect(result.value[0].build()).toEqual('module')
    })

    test('build can be overwritten with builder', () => {
      const valueMatcher = string('module')
      valueMatcher.builder = () => 'built'
      const matcher = sexp(valueMatcher)
      const wat = '("module")'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      assertMatched(result)
      expect(result.value[0].build()).toEqual('built')
    })

    test('failures can be logged', () => {
      const stringMatcher = string('module')
      stringMatcher.logger = jest.fn()
      const matcher = sexp(stringMatcher)
      const wat = '(alice)'
      const parser = Parser()
      const input = parser(wat)
      matcher(input)
      expect(stringMatcher.logger).toHaveBeenNthCalledWith(
        1,
        'string("module") failed to match [alice]',
        {
          typeOf: 'value',
          expected: 'module',
          input: ['alice'],
        }
      )
    })

    test('stringifies with expected string', () => {
      expect(String(string('module'))).toEqual('string("module")')
    })
  })
})
