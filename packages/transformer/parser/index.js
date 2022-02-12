/**
 * @template T
 * @typedef {import('./builder.mjs').Builder<T>} Builder<T>
 */

/**
 * @typedef {import('./builder.mjs').BuilderType} BuilderType
 * @typedef {import('./builder.mjs').Sexp} Sexp
 * @typedef {import('./builder.mjs').SexpMeta} SexpMeta
 */

import Builders, { TypeOfBuilder } from './builders.js'

/**
 * Creates a parser.
 * @param {Object} options
 * @param {string[]} [options.sourceTags]
 */
export const RawParser =
  ({ sourceTags = [] } = {}) =>
  /**
   * @param {string} wat
   */
  (wat) => {
    const {
      SexpBuilder,
      BlockCommentFragmentBuilder,
      BlockCommentBuilder,
      StringBuilder,
      WhitespaceBuilder,
      LineCommentBuilder,
      ValueBuilder,
    } = Builders(wat)

    let index = 0
    const root = SexpBuilder(index)
    /** @type {Builder<?>[]} */
    const stack = [root]

    /**
     * Adds a new builder to stack.
     *
     * @param {Builder<?>} next
     */
    function create(next) {
      const last = stack[stack.length - 1]
      if (last === undefined) {
        throw new Error('unexpected empty stack')
      }
      last.add?.(next)
      stack.push(next)
    }

    function endLiteral(offset = 0) {
      const last = stack[stack.length - 1]
      if (last === undefined) {
        throw new Error('unexpected empty stack')
      }
      last.end = index + offset
      stack.pop()
    }

    function currentType() {
      const last = stack[stack.length - 1]
      if (last === undefined) {
        throw new Error('unexpected empty stack')
      }
      return last.type
    }

    while (index < wat.length) {
      switch (wat[index]) {
        case '(': {
          const blockComment =
            index < wat.length - 1 &&
            wat[index + 1] === ';' &&
            !['string', 'line comment'].includes(currentType())
          if (blockComment) {
            switch (currentType()) {
              case 'whitespace':
              case 'value':
              case 'block comment fragment':
                endLiteral()
              // falls through
              case 'sexp':
              case 'block comment':
                create(BlockCommentBuilder())
                create(BlockCommentFragmentBuilder(index + 2))
                index++
                break
              case 'string':
              case 'line comment':
                break
            }
          } else {
            switch (currentType()) {
              case 'whitespace':
              case 'value':
                endLiteral()
              // falls through
              case 'sexp':
                create(SexpBuilder(index, sourceTags))
                break
              case 'string':
              case 'line comment':
              case 'block comment fragment':
                break
              case 'block comment':
                throw new Error('missing block comment fragment')
            }
          }
          break
        }
        case ')':
          switch (currentType()) {
            case 'whitespace':
            case 'value':
              endLiteral()
            // falls through
            case 'sexp':
              endLiteral(1)
              break
            case 'string':
            case 'line comment':
            case 'block comment fragment':
              break
            case 'block comment':
              throw new Error('missing block comment fragment')
          }
          break
        case '"': {
          const escaped =
            index > 0 && wat[index - 1] === '\\' && currentType() === 'string'
          if (escaped) {
            switch (currentType()) {
              case 'whitespace':
                endLiteral()
              // falls through
              case 'sexp':
                create(ValueBuilder(index))
                break
              case 'string':
              case 'value':
              case 'line comment':
              case 'block comment fragment':
                break
              case 'block comment':
                throw new Error('missing block comment fragment')
            }
          } else {
            switch (currentType()) {
              case 'whitespace':
              case 'value':
                endLiteral()
              // falls through
              case 'sexp':
                create(StringBuilder(index + 1))
                break
              case 'line comment':
              case 'block comment fragment':
                break
              case 'block comment':
                throw new Error('missing block comment fragment')
              case 'string':
                endLiteral()
                break
            }
          }
          break
        }
        case ' ': {
          const escaped =
            index > 0 && wat[index - 1] === '\\' && currentType() === 'value'
          if (escaped) {
            switch (currentType()) {
              case 'whitespace':
                endLiteral()
              // falls through
              case 'sexp':
                create(ValueBuilder(index))
                break
              case 'string':
              case 'value':
              case 'line comment':
              case 'block comment fragment':
                break
              case 'block comment':
                throw new Error('missing block comment fragment')
            }
          } else {
            switch (currentType()) {
              case 'value':
                endLiteral()
              // falls through
              case 'sexp':
                create(WhitespaceBuilder(index))
                break
              case 'whitespace':
              case 'string':
              case 'line comment':
              case 'block comment fragment':
                break
              case 'block comment':
                throw new Error('missing block comment fragment')
            }
          }
          break
        }
        case '\t':
          switch (currentType()) {
            case 'value':
              endLiteral()
            // falls through
            case 'sexp':
              create(WhitespaceBuilder(index))
              break
            case 'string':
            case 'whitespace':
            case 'line comment':
            case 'block comment fragment':
              break
            case 'block comment':
              throw new Error('missing block comment fragment')
          }
          break
        case '\n':
        case '\r':
          switch (currentType()) {
            case 'line comment':
            case 'value':
              endLiteral()
            // falls through
            case 'sexp':
              create(WhitespaceBuilder(index))
              break
            case 'string':
              throw new Error('unexpected newline in string')
            case 'whitespace':
            case 'block comment fragment':
              break
            case 'block comment':
              throw new Error('missing block comment fragment')
          }
          break
        case ';': {
          const lineComment =
            index < wat.length - 1 &&
            wat[index + 1] === ';' &&
            !['string', 'line comment', 'block comment fragment'].includes(
              currentType()
            )
          const closingBlockComment =
            index < wat.length - 1 &&
            wat[index + 1] === ')' &&
            currentType() === 'block comment fragment'
          if (closingBlockComment) {
            endLiteral()
            stack.pop()
            if (currentType() === 'block comment') {
              create(BlockCommentFragmentBuilder(index + 2))
            }
            index++
          } else if (lineComment) {
            switch (currentType()) {
              case 'value':
              case 'whitespace':
                endLiteral()
              // falls through
              case 'sexp':
                create(LineCommentBuilder(index + 2))
                index++
                break
              case 'string':
              case 'line comment':
              case 'block comment fragment':
                break
              case 'block comment':
                throw new Error('missing block comment fragment')
            }
          } else {
            switch (currentType()) {
              case 'whitespace':
                endLiteral()
              // falls through
              case 'sexp':
                create(ValueBuilder(index))
                break
              case 'string':
              case 'value':
              case 'line comment':
              case 'block comment fragment':
                break
              case 'block comment':
                throw new Error('missing block comment fragment')
            }
          }
          break
        }
        default: {
          switch (currentType()) {
            case 'whitespace':
              endLiteral()
            // falls through
            case 'sexp':
              create(ValueBuilder(index))
              break
            case 'string':
            case 'value':
            case 'line comment':
            case 'block comment fragment':
              break
            case 'block comment':
              throw new Error('missing block comment fragment')
          }
        }
      }
      index++
    }
    switch (currentType()) {
      case 'whitespace':
      case 'string':
      case 'value':
      case 'line comment':
        endLiteral()
        break
      case 'sexp':
        break
      case 'block comment fragment':
      case 'block comment':
        throw new Error('dangling block comment')
    }
    if (stack[stack.length - 1] !== root) {
      throw new Error(
        `unclosed ast. expected root, but got ${JSON.stringify(
          stack[stack.length - 1]
        )}`
      )
    }
    return root.build()
  }

/**
 * Trim comments and whitespace out of Sexp.
 *
 * @param {string | (Sexp | Sexp[]) & SexpMeta} node
 * @return {string | Sexp}
 */
function trim(node) {
  /** @type {WeakMap<any, BuilderType>} */
  const types = new WeakMap()

  if (Array.isArray(node)) {
    const children = node
      .filter(
        (child) =>
          !['block comment', 'line comment', 'whitespace'].includes(
            node.meta.typeOf(child)
          )
      )
      .map(trim)
    for (const child of children) {
      const type = Array.isArray(child) ? 'sexp' : node.meta.typeOf(child)
      if (type !== 'value') {
        types.set(child, type)
      }
    }

    return /** @type {Sexp} */ (
      /** @type {unknown} */ (
        Object.defineProperty(children, 'meta', {
          value: {
            ...node.meta,
            ...TypeOfBuilder(types),
          },
        })
      )
    )
  } else {
    return node
  }
}

/**
 * Creates a parser that removes comments and whitespace.
 * @param {Object} [options]
 */
export default (options) =>
  /**
   * @param {string} wat
   */
  (wat) =>
    trim(RawParser(options)(wat))
