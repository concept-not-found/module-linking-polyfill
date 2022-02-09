import Parser from '../parser/index.js'

import parseAdapterModule from './grammar.js'

describe('adapter module', () => {
  describe('parser', () => {
    test('empty module', () => {
      const wat = `
        (adapter module
        )
      `
      const parser = Parser()
      const input = parser(wat)
      const module = parseAdapterModule(input)
      expect(module).toEqual({
        type: 'adapter module',
        definitions: [],
      })
    })
  })
})
