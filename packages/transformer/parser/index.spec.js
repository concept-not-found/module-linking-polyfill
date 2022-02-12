import { toMatchTree } from './matchers.js'

import { RawParser as Parser } from './index.js'

expect.extend({ toMatchTree })

describe('parser', () => {
  test('output is an array', () => {
    const wat = '(module)'

    const parser = Parser()
    const result = parser(wat)
    expect(result).toMatchTree([['module']])
  })

  test('output can have multiple sexp', () => {
    const wat = '(module)(module)'

    const parser = Parser()
    const result = parser(wat)
    expect(result).toMatchTree([['module'], ['module']])
  })

  test('nested sexp are arrays', () => {
    const wat = '(module(func))'

    const parser = Parser()
    expect(parser(wat)).toMatchTree([['module', ['func']]])
  })

  test('nested block comments collapse', () => {
    const wat = '(;a(;b;)c;)'

    const parser = Parser()
    expect(parser(wat)).toMatchTree(['(;a(;b;)c;)'])
  })

  test('more nested block comments', () => {
    const wat = '(;(;(;;);)(;;)(;(;;););)'

    const parser = Parser()
    expect(parser(wat)).toMatchTree(['(;(;(;;);)(;;)(;(;;););)'])
  })

  test('line comments is just text within a block comment', () => {
    const wat = '(;;;line comment;;;)'

    const parser = Parser()
    expect(parser(wat)).toMatchTree(['(;;;line comment;;;)'])
  })

  test('block comments can contain newlines', () => {
    const wat = '(;\n;)'

    const parser = Parser()
    expect(parser(wat)).toMatchTree(['(;\n;)'])
  })

  test('value, strings and comments are all strings', () => {
    const wat = '(func"func"(;func;);;func\n)'

    const parser = Parser()
    const [[value, string, blockComment, lineComment]] = parser(wat)
    expect(value).toEqual('func')
    expect(String(string)).toEqual('func')
    expect(String(blockComment)).toEqual('func')
    expect(String(lineComment)).toEqual('func')
  })

  test('value, strings and comments are distinguished by type by container', () => {
    const wat = '(func"func"(;func;);;func\n)'

    const parser = Parser()
    const [container] = parser(wat)
    const [value, string, blockComment, lineComment] = container
    expect(container.meta.typeOf()).toBe('undefined')
    expect(container.meta.typeOf(value)).toBe('value')
    expect(container.meta.typeOf(string)).toBe('string')
    expect(container.meta.typeOf(blockComment)).toBe('block comment')
    expect(container.meta.typeOf(lineComment)).toBe('line comment')
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
    const [, adapterModule] = parser(wat)
    const [, , , , , , module] = adapterModule
    expect(module.meta.source).toBe('(module (;1;))')
  })
})
