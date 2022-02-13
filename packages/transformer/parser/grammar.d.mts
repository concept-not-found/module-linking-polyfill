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

export type Matcher<I, T, R> = ((input?: I) => MatchResult<T, R>) & {
  logger: Logger
} & {
  builder: Builder<T, R>
}

export type GrammarMatcher<T> = Matcher<Sexp | string, [T] | T[], T>

export type StringProposition = string | ((value: string) => boolean)
