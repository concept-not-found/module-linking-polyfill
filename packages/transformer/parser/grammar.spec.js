import { maybe, some } from 'patcom'
import { sexp, value } from './grammar.js'
import Parser from './index.js'

describe('parser grammar', () => {
  test('matches zero func', () => {
    const matcher = sexp(value('module'), maybe(some(sexp(value('func')))))

    const wat = `
      (module
      )
    `
    const parser = Parser()
    const input = parser(wat)
    const result = matcher(input)
    expect(result.matched).toBe(true)
  })

  test('matches one func', () => {
    const matcher = sexp(value('module'), maybe(some(sexp(value('func')))))

    const wat = `
      (module
        (func)
      )
    `
    const parser = Parser()
    const input = parser(wat)
    const result = matcher(input)
    expect(result.matched).toBe(true)
  })

  test('matches two func', () => {
    const matcher = sexp(value('module'), maybe(some(sexp(value('func')))))

    const wat = `
      (module
        (func)
        (func)
      )
    `
    const parser = Parser()
    const input = parser(wat)
    const result = matcher(input)
    expect(result.matched).toBe(true)
  })
})
