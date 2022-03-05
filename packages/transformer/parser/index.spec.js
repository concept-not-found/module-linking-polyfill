import { RawParser as Parser } from './index.js'

describe('parser', () => {
  test('output is an array', () => {
    const wat = '(module)'

    const parser = Parser()
    const result = parser(wat)
    expect(result).toEqual({
      type: 'sexp',
      value: [
        {
          type: 'sexp',
          value: [
            {
              type: 'value',
              value: 'module',
            },
          ],
        },
      ],
    })
  })

  test('output can have multiple sexp', () => {
    const wat = '(module)(module)'

    const parser = Parser()
    const result = parser(wat)
    expect(result).toEqual({
      type: 'sexp',
      value: [
        {
          type: 'sexp',
          value: [
            {
              type: 'value',
              value: 'module',
            },
          ],
        },
        {
          type: 'sexp',
          value: [
            {
              type: 'value',
              value: 'module',
            },
          ],
        },
      ],
    })
  })

  test('nested sexp are arrays', () => {
    const wat = '(module(func))'

    const parser = Parser()
    const result = parser(wat)
    expect(result).toEqual({
      type: 'sexp',
      value: [
        {
          type: 'sexp',
          value: [
            {
              type: 'value',
              value: 'module',
            },
            {
              type: 'sexp',
              value: [
                {
                  type: 'value',
                  value: 'func',
                },
              ],
            },
          ],
        },
      ],
    })
  })

  test('nested block comments collapse', () => {
    const wat = '(;a(;b;)c;)'

    const parser = Parser()
    const result = parser(wat)
    expect(result).toEqual({
      type: 'sexp',
      value: [
        {
          type: 'block comment',
          value: 'a(;b;)c',
        },
      ],
    })
  })

  test('more nested block comments', () => {
    const wat = '(;(;(;;);)(;;)(;(;;););)'

    const parser = Parser()
    const result = parser(wat)
    expect(result).toEqual({
      type: 'sexp',
      value: [
        {
          type: 'block comment',
          value: '(;(;;);)(;;)(;(;;);)',
        },
      ],
    })
  })

  test('line comments is just text within a block comment', () => {
    const wat = '(;;;line comment;;;)'

    const parser = Parser()
    const result = parser(wat)
    expect(result).toEqual({
      type: 'sexp',
      value: [
        {
          type: 'block comment',
          value: ';;line comment;;',
        },
      ],
    })
  })

  test('block comments can contain newlines', () => {
    const wat = '(;\n;)'

    const parser = Parser()
    const result = parser(wat)
    expect(result).toEqual({
      type: 'sexp',
      value: [
        {
          type: 'block comment',
          value: '\n',
        },
      ],
    })
  })

  test('value, strings and comments are all strings', () => {
    const wat = '(func"func"(;func;);;func\n)'

    const parser = Parser()
    const {
      value: [
        {
          value: [value, string, blockComment, lineComment],
        },
      ],
    } = parser(wat)
    expect(value.value).toEqual('func')
    expect(string.value).toEqual('func')
    expect(blockComment.value).toEqual('func')
    expect(lineComment.value).toEqual('func')
  })

  test('value, strings and comments are distinguished by type', () => {
    const wat = '(func"func"(;func;);;func\n)'

    const parser = Parser()
    const {
      value: [container],
    } = parser(wat)
    const {
      value: [value, string, blockComment, lineComment],
    } = container
    expect(value.type).toBe('value')
    expect(string.type).toBe('string')
    expect(blockComment.type).toBe('block comment')
    expect(lineComment.type).toBe('line comment')
  })

  test('capture an sexp by tag', () => {
    const wat = `
      (adapter module (;0;)
        (module (;1;))
      )
    `

    const parser = Parser({
      sourceTags: ['module'],
    })
    const {
      value: [
        ,
        {
          value: [, , , , , , { source }],
        },
      ],
    } = parser(wat)
    expect(source).toBe('(module (;1;))')
  })
})
