export type Node<T extends string> = {
  type: T
}

type BuilderType = 'sexp' | 'block comment fragment' | 'block comment' | 'string' | 'whitespace' | 'line comment' | 'value'

export type Builder<T> = {
  type: BuilderType
  add?: (...builders: Builder<any>[]) => Builder<T>
  end?: number
  build(): T
}

type SexpMeta = {
  meta: {
    typeOf(value: any): BuilderType,
    typeOfSexp(value: any): value is Sexp,
    typeOfStringLike(value: any): value is string,
    source: string
  }
}
export type Sexp = (Sexp | string)[] & SexpMeta
