export type Node<T extends string> = {
  type: T
}

type BuilderType = 'sexp' | 'block comment fragment' | 'block comment' | 'string' | 'whitespace' | 'line comment' | 'value' | 'undefined'

export type Buildable<T> = {
  build: () => T
}

export type Builder<T> = {
  type: BuilderType
  add?: (...builders: Builder<any>[]) => Builder<T>
  end?: number
} & Buildable<T>

export type TypeOfable = {
  typeOf(value: any): BuilderType
  typeOfSexp(value: any): value is Sexp
  typeOfStringLike(value: any): value is string
}

export type SexpMeta = {
  meta: {
    source: string
  } & TypeOfable
}
export type Sexp = (Sexp | string)[] & SexpMeta
