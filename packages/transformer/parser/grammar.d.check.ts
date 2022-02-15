// this file is funky in vs code.
// it works some of the time.
// this file is checked using npx tsc --project test-types.json

import { TypeOf, TypeEqual, expectType } from 'ts-expect'

import type { Sexp } from './builders.mjs'
import type {
  Matched,
  Matcher,
  ReferenceMatcher,
  MatcherToMatched,
  MatcherToBuilt,
} from './grammar.mjs'
import { sexp, value, any, reference, maybe } from './grammar.js'

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

expectType<Matcher<Sexp, any[], any>>(any())

const referenceValue: ReferenceMatcher<Matcher<Sexp, [string], string>> =
  reference()
expectType<Matcher<Sexp, [string], string>>(referenceValue)
referenceValue.value = value('alice')

type valueMatcher = Matcher<Sexp, [string], string>
expectType<valueMatcher>(value('alice'))

expectType<
  TypeEqual<MatcherToMatched<valueMatcher>, Matched<[string], string>>
>(true)
expectType<TypeEqual<MatcherToBuilt<valueMatcher>, string>>(true)

type maybeMatcher = Matcher<
  Sexp,
  [MatcherToMatched<valueMatcher>] | [],
  MatcherToBuilt<valueMatcher> | undefined
>
expectType<maybeMatcher>(maybe(value('alice')))

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

type OneOf<T extends any[]> = T extends [infer Head, ...infer Tail]
  ? Head | OneOf<Tail>
  : never

function picker<T extends any[]>(index: number, ...values: T): OneOf<T> {
  return values[index]
}

expectType<string | number>(picker(0, 123, 'hello'))
expectType<TypeOf<OneOf<[number, string]>, number>>(true)
expectType<TypeOf<OneOf<[number, string]>, string>>(true)
