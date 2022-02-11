import { assertMatched } from './grammar-test-utils.js'

import { sexp, any } from './grammar.js'

import Parser from './index.js'

describe('matcher', () => {
  describe('any', () => {
    test('matching everything remaining in sexp', () => {
      const matcher = sexp(any())
      const wat = '(alice bob)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      expect(result).toEqual({
        match: 'sexp',
        value: [
          {
            match: 'any',
            value: ['alice', 'bob'],
          },
        ],
      })
    })

    test('build returns input', () => {
      const matcher = sexp(any())
      const wat = '(alice bob)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      assertMatched(result)
      expect(result.value[0].build()).toEqual(['alice', 'bob'])
    })

    test('build can be overwritten with builder', () => {
      const valueMatcher = any()
      valueMatcher.builder = () => 'built'
      const matcher = sexp(valueMatcher)
      const wat = '(alice bob)'
      const parser = Parser()
      const input = parser(wat)
      const result = matcher(input)
      assertMatched(result)
      expect(result.value[0].build()).toEqual('built')
    })

    test('stringifies', () => {
      expect(String(any())).toEqual('any()')
    })
  })
})
