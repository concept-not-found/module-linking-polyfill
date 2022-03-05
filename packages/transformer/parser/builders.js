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
        build() {
          const value = children.map((builder) => builder.build())
          if (sourceTags.includes(value?.[0]?.value)) {
            return {
              type: 'sexp',
              value,
              source: wat.slice(start, this.end),
            }
          }
          return {
            type: 'sexp',
            value,
          }
        },
      }
      return builder
    },

    BlockCommentFragmentBuilder(start) {
      return {
        type: 'block comment fragment',
        build() {
          return {
            type: 'block comment fragment',
            value: wat.substring(start, this.end),
          }
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
            const result = builder.build()
            return result.type === 'block comment'
              ? `(;${result.value};)`
              : result.value
          })
          return {
            type: 'block comment',
            value: fragments.join(''),
          }
        },
      }
      return builder
    },

    StringBuilder(start) {
      return {
        type: 'string',
        build() {
          const value = wat.substring(start, this.end)
          return {
            type: 'string',
            value,
          }
        },
      }
    },

    WhitespaceBuilder(start) {
      return {
        type: 'whitespace',
        build() {
          const value = wat.substring(start, this.end)
          return {
            type: 'whitespace',
            value,
          }
        },
      }
    },

    LineCommentBuilder(start) {
      return {
        type: 'line comment',
        build() {
          const value = wat.substring(start, this.end)
          return {
            type: 'line comment',
            value,
          }
        },
      }
    },

    ValueBuilder(start) {
      return {
        type: 'value',
        build() {
          const value = wat.substring(start, this.end)
          return { type: 'value', value }
        },
      }
    },
  }
}
