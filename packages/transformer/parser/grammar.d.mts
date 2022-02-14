import type { Sexp, Buildable } from './builders.mjs'

export type MatchResult<T, R> = Matched<T, R> | NoMatch

export type Matched<T, R> = {
  match: string
  value: T
} & Buildable<R>

export type NoMatch = {
  match: false
}

export type Builder<T, R> = (value: T, context?: any) => R

export type Logger = (...messages: any[]) => void

export type Matcher<I, T, R> = ((input: I) => MatchResult<T, R>) & {
  logger: Logger
} & {
  builder: Builder<T, R>
}

export type GrammarMatcher<T, R> = Matcher<Sexp | string, T, R>

export type StringProposition = string | ((value: string) => boolean)

type MatcherToMatched<T> = T extends Matcher<Sexp, infer T, infer R> ? Matched<T, R> : T
export type MatchersToMatched<M extends any[]> = M extends [
  infer Head,
  ...infer Tail
] ? [MatcherToMatched<Head>, ...MatchersToMatched<Tail>]
  : []

type MatcherToBuilt<T> = T extends Matcher<Sexp, infer T, infer R> ? R : T
export type MatchersToBuilt<M extends any[]> = M extends [
  infer Head,
  ...infer Tail
] ? [MatcherToBuilt<Head>, ...MatchersToBuilt<Tail>]
  : []
