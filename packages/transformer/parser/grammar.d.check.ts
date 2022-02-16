// this file is funky in vs code.
// it works some of the time.
// this file is checked using npx tsc --checkJs false

import { TypeOf, TypeEqual, expectType } from 'ts-expect'

import type { Sexp, Buildable } from './builders.mjs'
import type {
  Builder,
  Matched,
  Matcher,
  ReferenceMatcher,
  MatcherToMatched,
  MatcherToBuilt,
  MatchersToMatched,
  MatchersToBuilt,
  MatchersToMatchedUnion,
  MatchersToBuiltUnion,
  MatchedToBuildable
} from './grammar.mjs'
import {
  sexp,
  value,
  any,
  reference,
  maybe,
  one,
  seq,
  some,
} from './grammar.js'

type valueResult = [string]
type valueBuilt = string
type valueMatcherType = Matcher<Sexp, valueResult, valueBuilt>
type valueMatched = Matched<valueResult, valueBuilt>
const valueMatcher = value('alice')
expectType<valueMatcherType>(valueMatcher)
expectType<TypeEqual<MatcherToMatched<valueMatcherType>, valueMatched>>(true)
expectType<TypeEqual<MatcherToBuilt<valueMatcherType>, valueBuilt>>(true)
expectType<TypeOf<Buildable<valueBuilt>, valueMatched>>(true)

type sexpResult = [valueMatched]
type sexpBuilt = [valueBuilt]
type sexpMatcherType = Matcher<Sexp, sexpResult, sexpBuilt>
type sexpMatched = Matched<sexpResult, sexpBuilt>
const sexpMatcher = sexp(valueMatcher)
expectType<sexpMatcherType>(sexpMatcher)
expectType<TypeEqual<MatcherToMatched<sexpMatcherType>, sexpMatched>>(true)
expectType<TypeEqual<MatcherToBuilt<sexpMatcherType>, sexpBuilt>>(true)

type sexpSexpResult = [sexpMatched]
type sexpSexpBuilt = [sexpBuilt]
type sexpSexpMatcherType = Matcher<Sexp, sexpSexpResult, sexpSexpBuilt>
type sexpSexpMatched = Matched<sexpSexpResult, sexpSexpBuilt>
const sexpSexpMatcher = sexp(sexpMatcher)
expectType<sexpSexpMatcherType>(sexpSexpMatcher)
expectType<TypeEqual<MatcherToMatched<sexpSexpMatcherType>, sexpSexpMatched>>(true)
expectType<TypeEqual<MatcherToBuilt<sexpSexpMatcherType>, sexpSexpBuilt>>(true)

expectType<
  Matcher<Sexp, [valueMatched, valueMatched], [valueBuilt, valueBuilt]>
>(sexp(value('alice'), value('alice')))
expectType<Matcher<Sexp, [valueMatched, sexpMatched], [valueBuilt, sexpBuilt]>>(
  sexp(value('alice'), sexp(value('bob')))
)

expectType<TypeEqual<MatcherToMatched<string>, never>>(true)
expectType<TypeEqual<MatcherToBuilt<string>, never>>(true)

expectType<TypeEqual<MatchersToMatched<[]>, []>>(true)
expectType<
  TypeEqual<
    MatchersToMatched<[valueMatcherType, sexpMatcherType]>,
    [valueMatched, sexpMatched]
  >
>(true)

expectType<TypeEqual<MatchersToBuilt<[]>, []>>(true)
expectType<
  TypeEqual<
    MatchersToBuilt<[valueMatcherType, sexpMatcherType]>,
    [valueBuilt, sexpBuilt]
  >
>(true)

expectType<TypeEqual<MatchersToMatchedUnion<[]>, never>>(true)
expectType<
  TypeEqual<
    MatchersToMatchedUnion<[valueMatcherType, sexpMatcherType]>,
    valueMatched | sexpMatched
  >
>(true)

expectType<TypeEqual<MatchersToBuiltUnion<[]>, never>>(true)
expectType<
  TypeEqual<
    MatchersToBuiltUnion<[valueMatcherType, sexpMatcherType]>,
    valueBuilt | sexpBuilt
  >
>(true)


expectType<Matcher<Sexp, any[], any>>(any())

const referenceValue: ReferenceMatcher<valueMatcherType> = reference()
expectType<valueMatcherType>(referenceValue)
referenceValue.value = value('alice')

type maybeResult = [valueMatched] | []
type maybeBuilt = valueBuilt | undefined
type maybeMatcherType = Matcher<Sexp, maybeResult, maybeBuilt>
type maybeMatched = Matched<maybeResult, maybeBuilt>
const maybeMatcher = maybe(valueMatcher)
expectType<maybeMatcherType>(maybeMatcher)
expectType<TypeEqual<MatcherToMatched<maybeMatcherType>, maybeMatched>>(true)
expectType<TypeEqual<MatcherToBuilt<maybeMatcherType>, maybeBuilt>>(true)
expectType<TypeOf<Buildable<maybeBuilt>, maybeMatched>>(true)

type oneResult = [valueMatched]
type oneBuilt = valueBuilt
type oneMatcherType = Matcher<Sexp, oneResult, oneBuilt>
type oneMatched = Matched<oneResult, oneBuilt>
const oneMatcher = one(valueMatcher)
expectType<oneMatcherType>(oneMatcher)
expectType<TypeEqual<MatcherToMatched<oneMatcherType>, oneMatched>>(true)
expectType<TypeEqual<MatcherToBuilt<oneMatcherType>, oneBuilt>>(true)
expectType<TypeOf<Buildable<maybeBuilt>, maybeMatched>>(true)

type doubleOneResult = [valueMatched | sexpMatched]
type doubleOneBuilt = valueBuilt | sexpBuilt
type doubleOneMatcherType = Matcher<Sexp, doubleOneResult, doubleOneBuilt>
type doubleOneMatched = Matched<doubleOneResult, doubleOneBuilt>
const doubleOneMatcher = one(valueMatcher, sexpMatcher)
expectType<doubleOneMatcherType>(doubleOneMatcher)
expectType<TypeEqual<MatcherToMatched<doubleOneMatcherType>, doubleOneMatched>>(true)
expectType<TypeEqual<MatcherToBuilt<doubleOneMatcherType>, doubleOneBuilt>>(true)

type seqResult = [valueMatched]
type seqBuilt = [valueBuilt]
type seqMatcherType = Matcher<Sexp, seqResult, seqBuilt>
type seqMatched = Matched<seqResult, seqBuilt>
const seqMatcher = seq(valueMatcher)
expectType<seqMatcherType>(seqMatcher)
expectType<TypeEqual<MatcherToMatched<seqMatcherType>, seqMatched>>(true)
expectType<TypeEqual<MatcherToBuilt<seqMatcherType>, seqBuilt>>(true)

type doubleSeqResult = [valueMatched, sexpMatched]
type doubleSeqBuilt = [valueBuilt, sexpBuilt]
type doubleSeqMatcherType = Matcher<Sexp, doubleSeqResult, doubleSeqBuilt>
type doubleSeqMatched = Matched<doubleSeqResult, doubleSeqBuilt>
const doubleSeqMatcher = seq(valueMatcher, sexpMatcher)
expectType<doubleSeqMatcherType>(doubleSeqMatcher)
expectType<TypeEqual<MatcherToMatched<doubleSeqMatcherType>, doubleSeqMatched>>(true)
expectType<TypeEqual<MatcherToBuilt<doubleSeqMatcherType>, doubleSeqBuilt>>(true)

type someResult = valueMatched[]
type someBuilt = valueBuilt[]
type someMatcherType = Matcher<Sexp, someResult, someBuilt>
type someMatched = Matched<someResult, someBuilt>
const someMatcher = some(valueMatcher)
expectType<someMatcherType>(someMatcher)
expectType<TypeEqual<MatcherToMatched<someMatcherType>, someMatched>>(true)
expectType<TypeEqual<MatcherToBuilt<someMatcherType>, someBuilt>>(true)


const name = value(() => true)

const kind = one(
  value('func'),
  value('global')
)
expectType<Matcher<Sexp, [valueMatched], valueBuilt>>(kind)
expectType<Builder<[valueMatched], valueBuilt>>(kind.builder)

expectType<TypeOf<Buildable<string>, valueMatched>>(true)
expectType<TypeEqual<Buildable<string>, MatchedToBuildable<valueMatched>>>(true)
expectType<TypeEqual<Buildable<string>, MatchedToBuildable<oneMatched>>>(true)

const kindName = [kind, maybe(name)] as const
const kindDefinition = sexp(...kindName)
expectType<Matcher<Sexp, [oneMatched, maybeMatched], [valueBuilt, maybeBuilt]>>(kindDefinition)
expectType<Builder<[oneMatched, maybeMatched], [oneBuilt, maybeBuilt]>>(kindDefinition.builder)

type KindDefinition = {
  type: string
  name: string
}

expectType<Builder<[oneMatched, maybeMatched], KindDefinition>>(kindDefinition.withBuilder((([kind, name]) => {
  return {
    type: kind.build(),
    name: name.build(),
  }
}) as Builder<[Buildable<string>, Buildable<string | undefined>], KindDefinition>).builder)

// worksheet
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
