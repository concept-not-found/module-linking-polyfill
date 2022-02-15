import type { Sexp, Buildable } from './builders.js'

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

export type Matcher<I, T, R> = ((input: I) => MatchResult<T, R>) & {
  logger: Logger
} & {
  builder: Builder<T, R>
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
  : M
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
  : M
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
