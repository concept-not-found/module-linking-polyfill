import {
  rest,
  match,
  asInternalIterator,
  IteratorMatcher,
  maybe,
  group,
  oneOf,
  some,
  not,
  when,
  otherwise,
} from 'patcom'

export const reference = () => {
  const referenceMatcher = IteratorMatcher((iterator) => {
    if (!referenceMatcher.matcher) {
      throw new Error('reference.matcher has not been set yet')
    }
    return referenceMatcher.matcher(iterator)
  })

  Object.defineProperty(referenceMatcher, 'matcher', {
    matcher: undefined,
    writable: true,
  })
  return referenceMatcher
}

const lineEnding = oneOf(group('\r', '\n'), '\r', '\n')
const sexpStart = '('
const sexpEnd = ')'
const whitespace = oneOf(' ', '\t', lineEnding)
const stringDeliminator = '"'
const blockCommentStart = group('(', ';')
const blockCommentEnd = group(';', ')')
const lineCommentStart = group(';', ';')
const deliminators = oneOf(
  sexpStart,
  sexpEnd,
  whitespace,
  stringDeliminator,
  blockCommentStart,
  blockCommentEnd,
  lineCommentStart
)
export const valueMatcher = when(some(not(deliminators)), (value) => {
  return {
    type: 'value',
    value: value.join(''),
  }
})

export const stringMatcher = when(
  group(
    stringDeliminator,
    maybe(some(oneOf(group('\\', '"'), not(stringDeliminator)))),
    stringDeliminator
  ),
  ([, value = []]) => {
    return {
      type: 'string',
      value: value.flat().join(''),
    }
  }
)

const whitespaceMatcher = when(some(whitespace), (value) => {
  return {
    type: 'whitespace',
    value: value.join(''),
  }
})

const blockCommentChildrenMatcher = reference()
export const blockCommentMatcher = when(
  group(
    blockCommentStart,
    maybe(some(blockCommentChildrenMatcher)),
    blockCommentEnd
  ),
  ([, value]) => {
    return {
      type: 'block comment',
      value: value ?? [],
    }
  }
)
const blockCommentValueMatcher = when(
  some(not(oneOf(blockCommentStart, blockCommentEnd))),
  (value) => {
    return {
      type: 'block comment value',
      value: value.join(''),
    }
  }
)
blockCommentChildrenMatcher.matcher = oneOf(
  blockCommentMatcher,
  blockCommentValueMatcher
)

export const lineCommentMatcher = when(
  group(lineCommentStart, maybe(some(not(lineEnding))), lineEnding),
  ([, value = []]) => {
    return {
      type: 'line comment',
      value: value.flat().join(''),
    }
  }
)

const sourceable = (matcher) =>
  IteratorMatcher((iterator) => {
    const start = iterator.now
    const result = matcher(iterator)
    const end = iterator.now
    if (result.matched) {
      return {
        ...result,
        get source() {
          const time = iterator.now
          const source = []
          iterator.jump(start)
          for (let index = start; index < end; index++) {
            source.push(iterator.next().value)
          }
          iterator.jump(time)
          return source.join('')
        },
      }
    }
    return result
  })

export const sexpMatcher = ({
  sourceTags = [],
  trimChildren = ['block comment', 'line comment', 'whitespace'],
} = {}) => {
  const sexpChildren = reference()

  const sexpMatcherInstance = when(
    sourceable(group(sexpStart, some(sexpChildren), sexpEnd)),
    ([, children], sourcable) => {
      const result = {
        type: 'sexp',
        value: children.filter(({ type }) => !trimChildren.includes(type)),
      }

      return match(result)(
        when(
          {
            type: 'sexp',
            value: [
              {
                type: 'value',
                value: oneOf(...sourceTags),
              },
              rest,
            ],
          },
          () => {
            result.source = sourcable.source
            return result
          }
        ),
        otherwise(() => result)
      )
    }
  )

  sexpChildren.matcher = oneOf(
    blockCommentMatcher,
    sexpMatcherInstance,
    lineCommentMatcher,
    stringMatcher,
    whitespaceMatcher,
    valueMatcher
  )
  return sexpMatcherInstance
}

export default (...parameters) =>
  (wat) =>
    match(asInternalIterator(wat))(
      when(
        group(
          maybe(whitespaceMatcher),
          maybe(sexpMatcher(...parameters)),
          maybe(whitespaceMatcher)
        ),
        ([, sexp]) => sexp
      )
    )
