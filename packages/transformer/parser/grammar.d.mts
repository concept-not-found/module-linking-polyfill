import type { Sexp } from './builder.mjs'

// export type MatchResult<T, R> = (Matched<T> & Buildable<R>) | NoMatch
export type MatchResult<T, R> = Matched<T, R> | NoMatch

export type Matched<T, R> = {
  match: string
  value: T
  build: () => R
}

// export type Buildable<T> = {
//   build: () => T
// }

export type NoMatch = {
  match: false
}

export type Builder<T, R> = (value: T, context?: any) => R

export type Matcher<I, T, R> = ((input?: I) => MatchResult<T, R>) & {
  logger: (...messages: any[]) => void
} & {
  builder: Builder<T, R>
}

export type GrammarMatcher<T> = Matcher<Sexp | string, T[], T>

export type StringProposition = string | ((value: string) => boolean)
