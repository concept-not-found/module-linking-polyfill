/* eslint-disable unicorn/new-for-builtins, unicorn/prefer-string-slice */
/**
 * @typedef {import('./builder.mjs').Sexp} Sexp
 */

/**
 * @template T
 * @typedef {import('./builder.mjs').Builder<T>} Builder<T>
 */

/**
 * Creates builder with wat source.
 * @param {string} wat
 */
export default (wat) => {
  return {
    /**
     * Create a s-expression builder.
     *
     * @param {number} start
     * @param {string[]} sourceTags
     * @return {Builder<Sexp>}
     */
    SexpBuilder(start, sourceTags = []) {
      /**
       * @type {Builder<any>[]}
       */
      const children = []
      /**
       * @type {Builder<Sexp>}
       */
      const builder = {
        type: 'sexp',
        add(...builders) {
          children.push(...builders)
          return builder
        },
        build() {
          const typedValues = children.map((builder) => [
            builder.build(),
            builder.type,
          ])
          const types = new WeakMap()

          /**
           * @param {any} value
           * @return string
           */
          function typeOf(value) {
            if (value === undefined) {
              return 'undefined'
            }
            return types.get(value) ?? 'value'
          }
          /**
           * @param {any} value
           * @return {value is Sexp}
           */
          function typeOfSexp(value) {
            return typeOf(value) === 'sexp'
          }
          /**
           * @param {any} value
           * @return {value is string}
           */
          function typeOfStringLike(value) {
            return ['string', 'value'].includes(typeOf(value))
          }
          const values = /** @type {Sexp} */ (
            /** @type {unknown} */ (
              Object.defineProperty([], 'meta', {
                value: {
                  typeOf,
                  typeOfSexp,
                  typeOfStringLike,
                },
              })
            )
          )
          for (const [value, type] of typedValues) {
            if (type !== 'value') {
              types.set(value, type)
            }
            values.push(value)
          }

          if (
            sourceTags.includes(/** @type {string} */ (values[0])) &&
            values.meta
          ) {
            values.meta.source = wat.slice(start, this.end)
          }
          return values
        },
      }
      return builder
    },

    /**
     * Create a block comment fragment builder.
     *
     * @param {number} start
     * @return {Builder<string>}
     */
    BlockCommentFragmentBuilder(start) {
      return {
        type: 'block comment fragment',
        build() {
          return wat.substring(start, this.end)
        },
      }
    },

    /**
     * Create a block comment builder.
     *
     * @returns {Builder<string>}
     */
    BlockCommentBuilder() {
      /**
       * @type {Builder<any>[]}
       */
      const children = []
      /**
       * @type {Builder<string>}
       */
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
          return /** @type {string} */ (new String(fragments.join('')))
        },
      }
      return builder
    },

    /**
     * Create a string builder.
     *
     * @param {number} start
     * @returns {Builder<string>}
     */
    StringBuilder(start) {
      return {
        type: 'string',
        build() {
          const value = wat.substring(start, this.end)
          // new String is required for identity equals
          return /** @type {string} */ (new String(value))
        },
      }
    },

    /**
     * Create a whitespace builder.
     *
     * @param {number} start
     * @returns {Builder<string>}
     */
    WhitespaceBuilder(start) {
      return {
        type: 'whitespace',
        build() {
          const value = wat.substring(start, this.end)
          // new String is required for identity equals
          return /** @type {string} */ (new String(value))
        },
      }
    },

    /**
     * Create a line comment builder.
     *
     * @param {number} start
     * @returns {Builder<string>}
     */
    LineCommentBuilder(start) {
      return {
        type: 'line comment',
        build() {
          const value = wat.substring(start, this.end)
          // new String is required for identity equals
          return /** @type {string} */ (new String(value))
        },
      }
    },

    /**
     * Create a value builder.
     *
     * @param {number} start
     * @returns {Builder<string>}
     */
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
