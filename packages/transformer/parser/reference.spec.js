import { sexp, reference, value } from './grammar.js'

import Parser from './index.js'

describe('matcher', () => {
  describe('reference', () => {
    test('reference passes through expected', () => {
      const valueReference = reference()
      const matcher = sexp(valueReference)
      valueReference.value = value('module')
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

    test('throws attempting to be used before value is set', () => {
      const valueReference = reference()
      const matcher = sexp(valueReference)
      const wat = '(module)'
      const parser = Parser()
      const input = parser(wat)
      expect(() => matcher(input)).toThrow()
    })

    test('throws attempting to set builder', () => {
      const valueReference = reference()
      expect(() => {
        valueReference.builder = () => 'built'
      }).toThrow()
    })

    test('throws attempting to set logger', () => {
      const valueReference = reference()
      expect(() => {
        valueReference.logger = () => 'built'
      }).toThrow()
    })

    test('stringifies to reference before value is set', () => {
      expect(String(reference())).toEqual('reference()')
    })

    test('stringifies to expected after value is set', () => {
      const valueReference = reference()
      valueReference.value = value('module')
      expect(String(valueReference)).toEqual('value("module")')
    })
  })
})
