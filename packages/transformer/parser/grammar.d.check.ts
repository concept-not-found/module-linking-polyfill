// this file is funky in vs code.
// it works some of the time.
// this file is checked using npx tsc --project test-types.json

import { expectType } from 'ts-expect'

import type { Sexp } from './builders.mjs'
import type { Matched, Matcher } from './grammar.mjs'
import { sexp, value } from './grammar.js'

expectType<Matcher<Sexp, [string], string>>(value('alice'))

expectType<Matcher<Sexp, [Matched<[string], string>], [string]>>(sexp(value('alice')));
expectType<Matcher<Sexp, [Matched<[Matched<[string], string>], [string]>], [[string]]>>(sexp(sexp(value('alice'))));
expectType<Matcher<Sexp, [Matched<[string], string>, Matched<[string], string>], [string, string]>>(sexp(value('alice'), value('alice')));

function passThroughTupleTypes<T extends any[]>(...types: T): T {
  return types
}

expectType<[number, string]>(passThroughTupleTypes(123, 'hello'))

type Box<T> = (value: T) => T
function Box<T>(value: T): T {
  return value
}

type Unbox<T> = T extends Box<infer U> ? U : T
type UnboxBoxes<T extends [...any[]]> = T extends [
  infer Head,
  ...infer Tail
]
  ? [Unbox<Head>, ...UnboxBoxes<Tail>]
  : []

function unbox<T extends [...any[]]>(
  ...boxes: [...T]
): UnboxBoxes<T> {
  return boxes.map((box) => box()) as UnboxBoxes<T>
}

expectType<[number, string]>(
  unbox(
    Box(123),
    Box('hello'),
  )
)

type Dox<T> = (value: T) => T
function Dox<T>(value: T): T {
  return value
}

type BoxToDox<T extends any[]> = T extends [
  infer Head,
  ...infer Tail
]
  ? [Dox<Unbox<Head>>, ...BoxToDox<Tail>]
  : []


function boxToDox<T extends any[]>(
  ...boxes: [...T]
): BoxToDox<T> {
  return boxes.map((box) => Dox(box())) as BoxToDox<T>
}

expectType<[Dox<number>, Dox<string>]>(
  boxToDox(
    Box(123),
    Box('hello'),
  )
)
