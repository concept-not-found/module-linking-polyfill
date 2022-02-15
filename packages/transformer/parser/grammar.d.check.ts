// this file is funky in vs code.
// it works some of the time.
// this file is checked using npx tsc --project test-types.json

import { expectType } from 'ts-expect'

import type { Sexp } from './builders.js'
import type { Matched, Matcher } from './grammar.js'
import { sexp, value } from './grammar.js'

expectType<Matcher<Sexp, [string], string>>(value('alice'))

expectType<Matcher<Sexp, [Matched<[string], string>], [string]>>(
  sexp(value('alice'))
)
expectType<
  Matcher<Sexp, [Matched<[Matched<[string], string>], [string]>], [[string]]>
>(sexp(sexp(value('alice'))))
expectType<
  Matcher<
    Sexp,
    [Matched<[string], string>, Matched<[string], string>],
    [string, string]
  >
>(sexp(value('alice'), value('alice')))

function passThroughTupleTypes<T extends any[]>(...types: T): T {
  return types
}

expectType<[number, string]>(passThroughTupleTypes(123, 'hello'))

type Boxy<T> = (value: T) => T
function Box<T>(value: T): T {
  return value
}

type Unboxy<T> = T extends Boxy<infer U> ? U : T
type UnboxyBoxes<T extends [...any[]]> = T extends [infer Head, ...infer Tail]
  ? [Unboxy<Head>, ...UnboxyBoxes<Tail>]
  : []

function unbox<T extends [...any[]]>(...boxes: [...T]): UnboxyBoxes<T> {
  return boxes.map((box) => box()) as UnboxyBoxes<T>
}

expectType<[number, string]>(unbox(Box(123), Box('hello')))

type Doxy<T> = (value: T) => T
function Dox<T>(value: T): T {
  return value
}

type BoxyToDoxy<T extends any[]> = T extends [infer Head, ...infer Tail]
  ? [Doxy<Unboxy<Head>>, ...BoxyToDoxy<Tail>]
  : []

function boxToDox<T extends any[]>(...boxes: [...T]): BoxyToDoxy<T> {
  return boxes.map((box) => Dox(box())) as BoxyToDoxy<T>
}

expectType<[Doxy<number>, Doxy<string>]>(boxToDox(Box(123), Box('hello')))
