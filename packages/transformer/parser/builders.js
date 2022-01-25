/* eslint-disable unicorn/new-for-builtins, unicorn/prefer-string-slice */

export default (wat) => {
  return {
    SexpBuilder(start, sourceTags = []) {
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
              if (value === undefined) {
                return
              }
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
    },

    BlockCommentFragmentBuilder(start) {
      return {
        type: 'block comment fragment',
        build() {
          return wat.substring(start, this.end)
        },
      }
    },

    BlockCommentBuilder() {
      const children = []
      const builder = {
        type: 'block comment',
        add(...builders) {
          children.push(...builders)
          return builder
        },
        build() {
          const fragments = children.map((builder) => {
            return builder.type === 'block comment'
              ? `(;${builder.build()};)`
              : builder.build()
          })
          // new String is required for identity equals
          return new String(fragments.join(''))
        },
      }
      return builder
    },

    StringBuilder(start) {
      return {
        type: 'string',
        build() {
          const value = wat.substring(start, this.end)
          // new String is required for identity equals
          return new String(value)
        },
      }
    },

    WhitespaceBuilder(start) {
      return {
        type: 'whitespace',
        build() {
          const value = wat.substring(start, this.end)
          // new String is required for identity equals
          return new String(value)
        },
      }
    },

    LineCommentBuilder(start) {
      return {
        type: 'line comment',
        build() {
          const value = wat.substring(start, this.end)
          // new String is required for identity equals
          return new String(value)
        },
      }
    },

    ValueBuilder(start) {
      return {
        type: 'value',
        build() {
          const value = wat.substring(start, this.end)
          return value
        },
      }
    },
  }
}
