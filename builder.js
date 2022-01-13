export function SexpBuilder(start, wat, sourceTags = []) {
  const children = []
  const builder = {
    type: 'sexp',
    add(...builders) {
      children.push(...builders)
      return builder
    },
    addSexp(...values) {
      children.push(
        ...values.map((value) => ({
          type: 'sexp',
          build() {
            return value
          },
        }))
      )
      return builder
    },
    addValue(...values) {
      children.push(
        ...values.map((value) => ({
          type: 'value',
          build() {
            return String(value)
          },
        }))
      )
      return builder
    },
    addString(...values) {
      children.push(
        ...values.map((value) => ({
          type: 'string',
          build() {
            return new String(value)
          },
        }))
      )
      return builder
    },
    addComment(...values) {
      children.push(
        ...values.map((value) => ({
          type: 'comment',
          build() {
            return new String(value)
          },
        }))
      )
      return builder
    },
    addWhitespace(...values) {
      children.push(
        ...values.map((value) => ({
          type: 'whitespace',
          build() {
            return new String(value)
          },
        }))
      )
      return builder
    },
    build() {
      const typedValues = children.map((builder) => [
        builder.build(),
        builder.type,
      ])
      const types = new WeakMap()
      const values = []
      for (const [value, type] of typedValues) {
        if (type !== 'value') {
          types.set(value, type)
        }
        values.push(value)
      }

      values.meta = {
        typeOf(value) {
          return types.get(value) ?? 'value'
        },
      }
      if (sourceTags.includes(values[0])) {
        values.meta.source = wat.slice(start, this.end)
      }
      return values
    },
  }
  return builder
}
