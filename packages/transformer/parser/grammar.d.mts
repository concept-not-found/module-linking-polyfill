import type { Sexp, Buildable } from './builders.mjs'

export type Matched<T, R> = {
  match: string
  value: T
} & Buildable<R>

export type NoMatch = {
  match: false
}

export type MatchResult<T, R> = Matched<T, R> | NoMatch

export type Builder<T, R> = (value: T, context?: any) => R

export type Logger = (...messages: any[]) => void

export type MatchedToBuildable<M> = M extends Matched<unknown, infer R> ? Buildable<R> : never
// export type MatchedArrayToBuildableArray<M extends any[]> = M extends [
//   infer Head,
//   ...infer Tail
// ]
//   ? [MatchedToBuildable<Head>, ...MatchedArrayToBuildableArray<Tail>]
//   : []

export type Matcher<I, T, R> = ((input: I) => MatchResult<T, R>) & {
  logger: Logger
} & {
  builder: Builder<T, R>,
  withBuilder: <RR>(builder: Builder<T, RR>) => Matcher<I, T, RR>
}

export type ReferenceMatcher<M> = M extends Matcher<
  infer _unused_I,
  infer _unused_T,
  infer _unused_R
>
  ? M & { value: M }
  : never

export type StringProposition = string | ((value: string) => boolean)

export type MatcherToMatched<M> = M extends Matcher<Sexp, infer T, infer R>
  ? Matched<T, R>
  : never
export type MatchersToMatched<M extends any[]> = M extends [
  infer Head,
  ...infer Tail
]
  ? [MatcherToMatched<Head>, ...MatchersToMatched<Tail>]
  : []

export type MatcherToBuilt<M> = M extends Matcher<
  Sexp,
  infer _unused_T,
  infer R
>
  ? R
  : never

export type MatchersToBuilt<M extends any[]> = M extends [
  infer Head,
  ...infer Tail
]
  ? [MatcherToBuilt<Head>, ...MatchersToBuilt<Tail>]
  : []

export type MatchersToMatchedUnion<M extends any[]> = M extends [
  infer Head,
  ...infer Tail
]
  ? MatcherToMatched<Head> | MatchersToMatchedUnion<Tail>
  : never

export type MatchersToBuiltUnion<M extends any[]> = M extends [
  infer Head,
  ...infer Tail
]
  ? MatcherToBuilt<Head> | MatchersToBuiltUnion<Tail>
  : never
