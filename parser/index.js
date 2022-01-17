import { SexpBuilder } from '../builder.js'

export default ({ sourceTags = [] } = {}) =>
  (wat) => {
    function BlockCommentFragmentBuilder(start) {
      return {
        type: 'block comment fragment',
        build() {
          return wat.substring(start, this.end)
        },
      }
    }
    function BlockCommentBuilder() {
      const children = []
      const builder = {
        type: 'block comment',
        add(...builders) {
          children.push(...builders)
          return builder
        },
        build() {
          const fragments = children.map((builder) => {
            if (builder.type === 'block comment') {
              return `(;${builder.build()};)`
            } else {
              return builder.build()
            }
          })
          // new String is required for identity equals
          return new String(fragments.join(''))
        },
      }
      return builder
    }

    function StringBuilder(start) {
      return {
        type: 'string',
        build() {
          const value = wat.substring(start, this.end)
          // new String is required for identity equals
          return new String(value)
        },
      }
    }

    function WhitespaceBuilder(start) {
      return {
        type: 'whitespace',
        build() {
          const value = wat.substring(start, this.end)
          // new String is required for identity equals
          return new String(value)
        },
      }
    }

    function LineCommentBuilder(start) {
      return {
        type: 'line comment',
        build() {
          const value = wat.substring(start, this.end)
          // new String is required for identity equals
          return new String(value)
        },
      }
    }

    function ValueBuilder(start) {
      return {
        type: 'value',
        build() {
          const value = wat.substring(start, this.end)
          return value
        },
      }
    }

    let index = 0
    const root = SexpBuilder(index, wat)
    const stack = [root]

    function create(next) {
      stack.at(-1).add(next)
      stack.push(next)
    }

    function endLiteral() {
      stack.at(-1).end = index
      stack.pop()
    }

    while (index < wat.length) {
      switch (wat[index]) {
        case '(': {
          const blockComment =
            index < wat.length - 1 &&
            wat[index + 1] === ';' &&
            !['string', 'line comment'].includes(stack.at(-1).type)
          if (blockComment) {
            switch (stack.at(-1).type) {
              case 'whitespace':
              case 'value':
              case 'block comment fragment':
                endLiteral()
              // fall-through
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
            switch (stack.at(-1).type) {
              case 'whitespace':
              case 'value':
                endLiteral()
              // fall-through
              case 'sexp':
                create(SexpBuilder(index, wat, sourceTags))
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
          switch (stack.at(-1).type) {
            case 'whitespace':
            case 'value':
              endLiteral()
            // fall-through
            case 'sexp':
              stack.at(-1).end = index + 1
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
            stack.at(-1).type === 'string'
          if (escaped) {
            switch (stack.at(-1).type) {
              case 'whitespace':
                endLiteral()
              // fall-through
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
            switch (stack.at(-1).type) {
              case 'whitespace':
              case 'value':
                endLiteral()
              // fall-through
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
            stack.at(-1).type === 'value'
          if (escaped) {
            switch (stack.at(-1).type) {
              case 'whitespace':
                endLiteral()
              // fall-through
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
            switch (stack.at(-1).type) {
              case 'value':
                endLiteral()
              // fall-through
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
          switch (stack.at(-1).type) {
            case 'value':
              endLiteral()
            // fall-through
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
          switch (stack.at(-1).type) {
            case 'line comment':
            case 'value':
              endLiteral()
            // fall-through
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
              stack.at(-1).type
            )
          const closingBlockComment =
            index < wat.length - 1 &&
            wat[index + 1] === ')' &&
            stack.at(-1).type === 'block comment fragment'
          if (closingBlockComment) {
            endLiteral()
            stack.pop()
            if (stack.at(-1).type === 'block comment') {
              create(BlockCommentFragmentBuilder(index + 2))
            }
            index++
          } else if (lineComment) {
            switch (stack.at(-1).type) {
              case 'value':
              case 'whitespace':
                endLiteral()
              // fall-through
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
            switch (stack.at(-1).type) {
              case 'whitespace':
                endLiteral()
              // fall-through
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
          switch (stack.at(-1).type) {
            case 'whitespace':
              endLiteral()
            // fall-through
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
    switch (stack.at(-1).type) {
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
    if (stack.at(-1) !== root) {
      throw new Error(
        `unclosed ast. expected root, but got ${JSON.stringify(stack.at(-1))}`
      )
    }
    return root.build()
  }
