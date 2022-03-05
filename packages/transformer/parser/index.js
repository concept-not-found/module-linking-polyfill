import pipe from '../pipe.js'

import Builders from './builders.js'

export const RawParser =
  ({ sourceTags = [] } = {}) =>
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
    const stack = [root]

    function create(next) {
      stack[stack.length - 1].add(next)
      stack.push(next)
    }

    function endLiteral() {
      stack[stack.length - 1].end = index
      stack.pop()
    }

    while (index < wat.length) {
      switch (wat[index]) {
        case '(': {
          const blockComment =
            index < wat.length - 1 &&
            wat[index + 1] === ';' &&
            !['string', 'line comment'].includes(stack[stack.length - 1].type)
          if (blockComment) {
            switch (stack[stack.length - 1].type) {
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
            switch (stack[stack.length - 1].type) {
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
          switch (stack[stack.length - 1].type) {
            case 'whitespace':
            case 'value':
              endLiteral()
            // falls through
            case 'sexp':
              stack[stack.length - 1].end = index + 1
              stack.pop()
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
            index > 0 &&
            wat[index - 1] === '\\' &&
            stack[stack.length - 1].type === 'string'
          if (escaped) {
            switch (stack[stack.length - 1].type) {
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
            switch (stack[stack.length - 1].type) {
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
            index > 0 &&
            wat[index - 1] === '\\' &&
            stack[stack.length - 1].type === 'value'
          if (escaped) {
            switch (stack[stack.length - 1].type) {
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
            switch (stack[stack.length - 1].type) {
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
          switch (stack[stack.length - 1].type) {
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
          switch (stack[stack.length - 1].type) {
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
              stack[stack.length - 1].type
            )
          const closingBlockComment =
            index < wat.length - 1 &&
            wat[index + 1] === ')' &&
            stack[stack.length - 1].type === 'block comment fragment'
          if (closingBlockComment) {
            endLiteral()
            stack.pop()
            if (stack[stack.length - 1].type === 'block comment') {
              create(BlockCommentFragmentBuilder(index + 2))
            }
            index++
          } else if (lineComment) {
            switch (stack[stack.length - 1].type) {
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
            switch (stack[stack.length - 1].type) {
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
          switch (stack[stack.length - 1].type) {
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
    switch (stack[stack.length - 1].type) {
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

function trim(node) {
  if (node.type === 'sexp') {
    const children = node.value
      .filter(
        ({ type }) =>
          !['block comment', 'line comment', 'whitespace'].includes(type)
      )
      .map(trim)
    return {
      ...node,
      value: children,
    }
  } else {
    return node
  }
}

export default (...parameters) => pipe(RawParser(...parameters), trim)
