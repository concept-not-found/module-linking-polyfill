import { forceMeta } from './builders.js'

const consumedCache = new WeakMap()

/**
 * @typedef {import('./builder.mjs').Sexp} Sexp
 * @typedef {import('./builder.mjs').SexpMeta} SexpMeta
 * @typedef {import('./grammar.mjs').StringProposition} StringProposition
 * @typedef {import('./grammar.mjs').NoMatch} NoMatch
 */

/**
 * @template T
 * @typedef {import('./grammar.mjs').GrammarMatcher<T>} GrammarMatcher<T>
 */

/**
 * @template T,R
 * @typedef {import('./grammar.mjs').Matched<T, R>} Matched<T, R>
 */

/**
 * @template T,R
 * @typedef {import('./grammar.mjs').Builder<T, R>} Builder<T, R>
 */

/** @type {NoMatch} */
const NoMatch = {
  match: false,
}

/**
 * Calculates how many values were consumed in a result.
 * @param {Matched<any, any> | any} result
 * @return {number}
 */
function calculateConsumed(result) {
  if (!Array.isArray(result.value)) {
    return 1
  }
  if (consumedCache.has(result)) {
    return consumedCache.get(result)
  }
  // eslint-disable-next-line unicorn/no-array-reduce
  const consumed =
    result.match === 'sexp'
      ? 1
      : result.value.reduce(
          /**
           * @param {number} total
           * @param {any} child
           */
          (total, child) => {
            return total + calculateConsumed(child)
          },
          0
        )
  consumedCache.set(result, consumed)
  return consumed
}

/**
 * Create a s-expression matcher with expected children.
 *
 * @param {GrammarMatcher<any>[]} expected
 * @returns {GrammarMatcher<any>}
 */
export const sexp = (...expected) => {
  /**
   * @param {string | Sexp | undefined} container
   */
  function matcher(container) {
    if (container !== undefined && typeof container !== 'string') {
      let [input] = container
      const originalInput = input
      if (
        input === undefined ||
        typeof input === 'string' ||
        !container.meta.typeOfSexp(input)
      ) {
        matcher.logger(`${matcher} failed to match [${input}]`, {
          typeOf: container.meta.typeOf(input),
          expected: expected.map(String),
          input,
        })
        return NoMatch
      }

      const value = []
      for (const child of expected) {
        const childResult = child(input)
        if (!childResult.match) {
          matcher.logger(`${matcher} failed to match [${originalInput}]`, {
            expected: expected.map(String),
            input: originalInput,
            unmatchedExpected: String(child),
            matched: value,
            unmatched: input,
          })
          return NoMatch
        }
        value.push(childResult)
        const { meta } = input
        const nextInput = input.slice(calculateConsumed(childResult))
        forceMeta(nextInput)
        input = nextInput
        Object.defineProperty(input, 'meta', { value: meta })
      }
      const match = input.length === 0 && value.length > 0 && 'sexp'
      if (match) {
        const result = {
          match,
          value,
          build: () => matcher.builder(result.value, input),
        }
        Object.defineProperty(result, 'build', {
          value: result.build,
          enumerable: false,
        })
        return result
      }
      matcher.logger(`${matcher} failed to match [${originalInput}]`, {
        expected: expected.map(String),
        input: originalInput,
        matched: value,
        unmatched: input,
      })
    }
    return NoMatch
  }
  Object.defineProperty(matcher, 'logger', {
    value: /** @type {(...messages: any[]) => void} */ (() => {}),
    writable: true,
  })
  Object.defineProperty(matcher, 'builder', {
    value: /** @type {Builder<Matched<any[], any>[], any>} */ (
      (value) => value.map(({ build }) => build())
    ),
    writable: true,
  })

  matcher.toString = () => `sexp(${expected.join(', ')})`

  return matcher
}

/**
 * Equals with polymorphic expected parameter.
 *
 * @param {StringProposition} expected
 * @param {any} value
 * @return boolean
 */
function equals(expected, value) {
  switch (typeof expected) {
    case 'string':
      return expected === value

    case 'function':
      return expected(value)

    default:
      return false
  }
}

/**
 * Create a s-expression value matcher
 *
 * @param {StringProposition} expected
 * @returns {GrammarMatcher<string>}
 */
export const value = (expected) => {
  /**
   * @param {string | Sexp | undefined} input
   */
  function matcher(input) {
    if (input !== undefined && typeof input !== 'string') {
      const [value] = input
      const match =
        value !== undefined &&
        input.meta.typeOfStringLike(value) &&
        input.meta.typeOf(value) === 'value' &&
        equals(expected, value) &&
        'value'
      if (match) {
        const result = {
          match,
          value: [value],
          build: () => matcher.builder(result.value),
        }
        Object.defineProperty(result, 'build', {
          value: result.build,
          enumerable: false,
        })
        return result
      }
    }
    if (typeof input !== 'string') {
      matcher.logger(`${matcher} failed to match [${input}]`, {
        typeOf: input?.meta.typeOf(input[0]),
        expected,
        input: input?.map(String),
      })
    }
    return NoMatch
  }
  Object.defineProperty(matcher, 'logger', {
    value: /** @type {(...messages: any[]) => void} */ (() => {}),
    writable: true,
  })
  Object.defineProperty(matcher, 'builder', {
    value: /** @type {Builder<string[], string>} */ (([value]) => value),
    writable: true,
  })

  matcher.toString = () => `value("${expected}")`
  return matcher
}

/**
 * Create a s-expression string matcher
 *
 * @param {StringProposition} expected
 * @returns {GrammarMatcher<string>}
 */
export const string = (expected) => {
  /**
   * @param {string | Sexp | undefined} input
   */
  function matcher(input) {
    if (input !== undefined && typeof input !== 'string') {
      const [value] = input
      const match =
        value !== undefined &&
        input.meta.typeOfStringLike(value) &&
        input.meta.typeOf(value) === 'string' &&
        equals(expected, String(value)) &&
        'string'
      if (match) {
        const result = {
          match,
          value: [String(value)],
          build: () => matcher.builder(result.value),
        }
        Object.defineProperty(result, 'build', {
          value: result.build,
          enumerable: false,
        })
        return result
      }
    }
    if (typeof input !== 'string') {
      matcher.logger(`${matcher} failed to match [${input}]`, {
        typeOf: input?.meta.typeOf(input[0]),
        expected,
        input: input?.map(String),
      })
    }
    return NoMatch
  }
  Object.defineProperty(matcher, 'logger', {
    value: /** @type {(...messages: any[]) => void} */ (() => {}),
    writable: true,
  })
  Object.defineProperty(matcher, 'builder', {
    value: /** @type {Builder<string[], string>} */ (([value]) => value),
    writable: true,
  })

  matcher.toString = () => `string("${expected}")`
  return matcher
}

/**
 * Create a s-expression any matcher, which matches anything.
 *
 * @returns {GrammarMatcher<any>}
 */
export const any = () => {
  /**
   * @param {any} input
   */
  function matcher(input) {
    const result = {
      match: 'any',
      value: input,
      build: () => matcher.builder(result.value),
    }
    Object.defineProperty(result, 'build', {
      value: result.build,
      enumerable: false,
    })
    return result
  }
  Object.defineProperty(matcher, 'logger', {
    value: /** @type {(...messages: any[]) => void} */ (() => {}),
    writable: true,
  })
  Object.defineProperty(matcher, 'builder', {
    value: /** @type {Builder<any, any>} */ ((value) => value),
    writable: true,
  })

  matcher.toString = () => 'any()'
  return matcher
}

/**
 * Create a s-expression reference matcher, which allows circular references to other matchers.
 *
 * @returns {GrammarMatcher<any> & {value: GrammarMatcher<any> | undefined}}
 */
export const reference = () => {
  /**
   * @param {string | Sexp | undefined} input
   */
  function matcher(input) {
    if (!matcher.value) {
      throw new Error('reference.value has not been set yet')
    }
    return matcher.value(input)
  }
  Object.defineProperty(matcher, 'logger', {
    value: /** @type {(...messages: any[]) => void} */ (() => {}),
    writable: false,
  })
  Object.defineProperty(matcher, 'builder', {
    value: /** @type {Builder<any[], any>} */ (() => {}),
    writable: false,
  })

  matcher.toString = () => matcher.value?.toString() ?? 'reference()'
  Object.defineProperty(matcher, 'value', {
    /** @type {GrammarMatcher<any> | undefined} */
    value: undefined,
    writable: true,
  })
  return matcher
}

/**
 * Create a s-expression matcher that optionally matches an expected.
 *
 * @param {GrammarMatcher<any>} expected
 * @returns {GrammarMatcher<any>}
 */
export const maybe = (expected) => {
  /**
   * @param {string | Sexp | undefined} input
   */
  function matcher(input) {
    const childResult = expected(input)
    /** @type {Matched<any[], any>} */
    const result = childResult.match
      ? {
          match: 'maybe',
          value: [childResult],
          build: () => matcher.builder(result.value),
        }
      : {
          match: 'maybe',
          value: [],
          build: () => matcher.builder(result.value),
        }
    Object.defineProperty(result, 'build', {
      value: result.build,
      enumerable: false,
    })
    return result
  }
  Object.defineProperty(matcher, 'logger', {
    value: /** @type {(...messages: any[]) => void} */ (() => {}),
    writable: true,
  })
  Object.defineProperty(matcher, 'builder', {
    value: /** @type {Builder<Matched<any[], any>[], any>} */ (
      ([value]) => value?.build()
    ),
    writable: true,
  })

  matcher.toString = () => `maybe(${expected})`
  return matcher
}

/**
 * Create a s-expression matcher that the first expected child.
 *
 * @param {GrammarMatcher<any>[]} expected
 * @returns {GrammarMatcher<any>}
 */
export const one = (...expected) => {
  /**
   * @param {string | Sexp | undefined} input
   */
  function matcher(input) {
    for (const child of expected) {
      const childResult = child(input)
      if (childResult.match) {
        const result = {
          match: 'one',
          value: [childResult],
          build: () => matcher.builder(result.value),
        }
        Object.defineProperty(result, 'build', {
          value: result.build,
          enumerable: false,
        })
        return result
      }
    }
    matcher.logger(`${matcher} failed to match ${input}`, {
      expected: expected.map(String),
      input,
    })
    return NoMatch
  }
  Object.defineProperty(matcher, 'logger', {
    value: /** @type {(...messages: any[]) => void} */ (() => {}),
    writable: true,
  })
  Object.defineProperty(matcher, 'builder', {
    value: /** @type {Builder<Matched<any[], any>[], any>} */ (
      ([value]) => value?.build()
    ),
    writable: true,
  })

  matcher.toString = () => `one(${expected.join(', ')})`
  return matcher
}

/**
 * Create a s-expression matcher for a sequence of children.
 *
 * @param {GrammarMatcher<any>[]} expected
 * @returns {GrammarMatcher<any>}
 */
export const seq = (...expected) => {
  /**
   * @param {string | Sexp | undefined} input
   */
  function matcher(input) {
    const originalInput = input
    const value = []
    for (const child of expected) {
      const childResult = child(input)
      if (!childResult.match) {
        matcher.logger(`${matcher} failed to match [${originalInput}]`, {
          expected: expected.map(String),
          input: originalInput,
          unmatchedExpected: String(child),
          matched: value,
          unmatched: input,
        })
        return NoMatch
      }
      value.push(childResult)
      forceMeta(input)
      const { meta } = input
      const nextInput = input.slice(calculateConsumed(childResult))
      forceMeta(nextInput)
      input = nextInput
      Object.defineProperty(input, 'meta', { value: meta })
    }
    const result = {
      match: 'seq',
      value,
      build: () => matcher.builder(result.value),
    }
    Object.defineProperty(result, 'build', {
      value: result.build,
      enumerable: false,
    })
    return result
  }
  Object.defineProperty(matcher, 'logger', {
    value: /** @type {(...messages: any[]) => void} */ (() => {}),
    writable: true,
  })
  Object.defineProperty(matcher, 'builder', {
    value: /** @type {Builder<Matched<any[], any>[], any>} */ (
      (value) => value.map(({ build }) => build())
    ),
    writable: true,
  })

  matcher.toString = () => `seq(${expected.join(', ')})`
  return matcher
}

/**
 * Create a s-expression matcher that repeatedly matches an expected.
 *
 * @param {GrammarMatcher<any>} expected
 * @returns {GrammarMatcher<any>}
 */
export const some = (expected) => {
  /**
   * @param {string | Sexp | undefined} input
   */
  function matcher(input) {
    if (input === undefined || input.length === 0) {
      matcher.logger(`${matcher} failed to match [${input}]`, {
        expected: String(expected),
        input,
      })
      return NoMatch
    }
    const value = []
    let childResult = expected(input)
    while (childResult.match) {
      value.push(childResult)
      forceMeta(input)
      const { meta } = input
      const nextInput = input.slice(calculateConsumed(childResult))
      forceMeta(nextInput)
      input = nextInput
      Object.defineProperty(input, 'meta', { value: meta })
      if (input.length === 0) {
        break
      }
      childResult = expected(input)
    }
    const match = value.length > 0 && 'some'
    if (match) {
      const result = {
        match,
        value,
        build: () => matcher.builder(result.value),
      }
      Object.defineProperty(result, 'build', {
        value: result.build,
        enumerable: false,
      })
      return result
    }
    matcher.logger(`${matcher} failed to match [${input}]`, {
      expected: String(expected),
      input,
    })
    return NoMatch
  }
  Object.defineProperty(matcher, 'logger', {
    value: /** @type {(...messages: any[]) => void} */ (() => {}),
    writable: true,
  })
  Object.defineProperty(matcher, 'builder', {
    value: /** @type {Builder<Matched<any[], any>[], any>} */ (
      (value) => value.map(({ build }) => build())
    ),
    writable: true,
  })

  matcher.toString = () => `some(${expected})`
  return matcher
}
