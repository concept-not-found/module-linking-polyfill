import { forceMeta } from './builders.js'

const consumedCache = new WeakMap()

/**
 * @typedef {import('./builders.mjs').Sexp} Sexp
 * @typedef {import('./builders.mjs').SexpMeta} SexpMeta
 * @typedef {import('./grammar.mjs').StringProposition} StringProposition
 * @typedef {import('./grammar.mjs').NoMatch} NoMatch
 */

/**
 * @template I,T,R
 * @typedef {import('./grammar.mjs').Matcher<I, T, R>} Matcher<I, T, R>
 */

/**
 * @template T,R
 * @typedef {import('./grammar.mjs').MatchResult<T, R>} MatchResult<T, R>
 */

/**
 * @template T,R
 * @typedef {import('./grammar.mjs').Matched<T, R>} Matched<T, R>
 */

/**
 * @template T
 * @typedef {import('./builders.mjs').Buildable<T>} Buildable<T>
 */

/**
 * @template T,R
 * @typedef {import('./grammar.mjs').Builder<T, R>} Builder<T, R>
 */

/**
 * @template T
 * @typedef {import('./grammar.mjs').MatchersToMatched<T>} MatchersToMatched<T>
 */

/**
 * @template T
 * @typedef {import('./grammar.mjs').MatchersToBuilt<T>} MatchersToBuilt<T>
 */

/**
 * @template T
 * @typedef {import('./grammar.mjs').MatchersToMatchedUnion<T>} MatchersToMatchedUnion<T>
 */

/**
 * @template T
 * @typedef {import('./grammar.mjs').MatchersToBuiltUnion<T>} MatchersToBuiltUnion<T>
 */

/**
 * @template T,R
 * @param {string} match
 * @param {T} value
 * @param {Builder<T, R>} builder
 * @returns {Matched<T, R>}
 */
export function Matched(match, value, builder) {
  const result = {
    match,
    value,
    build: () => builder(result.value),
  }
  Object.defineProperty(result, 'build', {
    value: result.build,
    enumerable: false,
  })

  return result
}

/** @type {NoMatch} */
export const NoMatch = {
  match: false,
}

/**
 * @template I, T, R
 * @param {Matcher<I, T, R>} matcher
 */
function enableMetaFields(matcher) {
  Object.defineProperties(matcher, {
    logger: {
      value: matcher.logger,
      writable: true,
      enumerable: false,
    },
    builder: {
      value: matcher.builder,
      enumerable: false,
    },
    withBuilder: {
      value: matcher.withBuilder,
      enumerable: false,
    },
  })
}

/**
 * Calculates how many values were consumed in a result.
 * @param {Matched<any, any> | any} result
 * @returns {number}
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
 * Returns input less what was consmed by match result.
 *
 * @template T,R
 * @param {string | Sexp | undefined} input
 * @param {Matched<T, R>} matchResult
 * @returns {Sexp}
 */
function consumeInput(input, matchResult) {
  forceMeta(input)
  const nextInput = input.slice(calculateConsumed(matchResult))
  Object.defineProperty(nextInput, 'meta', { value: input.meta })
  forceMeta(nextInput)

  return nextInput
}

/**
 * Create a s-expression matcher with expected children.
 *
 * @template {any[]} E
 * @param {E} expected
 * @returns {Matcher<Sexp, MatchersToMatched<E>, MatchersToBuilt<E>>}
 */
export const sexp = (...expected) => {
  /**
   * @param {Sexp} container
   */
  function matcher(container) {
    let [input] = container
    const originalInput = input
    if (!container.meta.typeOfSexp(input)) {
      matcher.logger(`${matcher} failed to match [${input}]`, {
        typeOf: container.meta.typeOf(input),
        expected: expected.map(String),
        input,
      })
      return NoMatch
    }

    const childResults = []
    for (const child of expected) {
      /** @type {MatchResult<unknown, unknown>} */
      const childResult = child(input)
      if (!childResult.match) {
        matcher.logger(`${matcher} failed to match [${originalInput}]`, {
          expected: expected.map(String),
          input: originalInput,
          unmatchedExpected: String(child),
          matched: childResults,
          unmatched: input,
        })
        return NoMatch
      }
      childResults.push(childResult)
      input = consumeInput(input, childResult)
    }
    const value = /** @type {MatchersToMatched<E>} */ (childResults)
    const match = input.length === 0 && value.length > 0 && 'sexp'
    if (match) {
      return Matched(match, value, (value) => matcher.builder(value, input))
    }
    matcher.logger(`${matcher} failed to match [${originalInput}]`, {
      expected: expected.map(String),
      input: originalInput,
      matched: value,
      unmatched: input,
    })

    return NoMatch
  }
  /** @type {(...messages: any[]) => void} */
  matcher.logger = () => {}
  /**
   * @param {Buildable<unknown>[]} value
   * @param {any} context
   * */
  matcher.builder = (value, context) =>
    /** @type {MatchersToBuilt<E>} */ (value.map(({ build }) => build()))
  /**
   * @template RR
   * @param {Builder<MatchersToMatched<E>, RR>} builder
   * @returns {Matcher<Sexp, MatchersToMatched<E>, RR>}
   */
  matcher.withBuilder = (builder) => {
    const result = /** @type {Matcher<Sexp, MatchersToMatched<E>, RR>} */ (
      /** @type {unknown} */ (matcher)
    )
    result.builder = builder
    return result
  }
  enableMetaFields(matcher)

  matcher.toString = () => `sexp(${expected.join(', ')})`

  return matcher
}

/**
 * Equals with polymorphic expected parameter.
 *
 * @param {StringProposition} expected
 * @param {any} value
 * @returns boolean
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
 * @returns {Matcher<Sexp, [string], string>}
 */
export const value = (expected) => {
  /**
   * @param {Sexp} input
   */
  function matcher(input) {
    const [value] = input
    const match =
      input.meta.typeOfStringLike(value) &&
      input.meta.typeOf(value) === 'value' &&
      equals(expected, value) &&
      'value'
    if (match) {
      return Matched(match, [value], matcher.builder)
    }
    matcher.logger(`${matcher} failed to match [${input}]`, {
      typeOf: input?.meta.typeOf(input[0]),
      expected,
      input: input?.map(String),
    })
    return NoMatch
  }
  /** @type {(...messages: any[]) => void} */
  matcher.logger = () => {}
  /** @type {Builder<[string], string>} */
  matcher.builder = ([value]) => value
  /**
   * @template RR
   * @param {Builder<[string], RR>} builder
   * @returns {Matcher<Sexp, [string], RR>}
   */
  matcher.withBuilder = (builder) => {
    const result = /** @type {Matcher<Sexp, [string], RR>} */ (
      /** @type {unknown} */ (matcher)
    )
    result.builder = builder
    return result
  }
  enableMetaFields(matcher)

  matcher.toString = () => `value("${expected}")`
  return matcher
}

/**
 * Create a s-expression string matcher
 *
 * @param {StringProposition} expected
 * @returns {Matcher<Sexp, [string], string>}
 */
export const string = (expected) => {
  /**
   * @param {Sexp} input
   */
  function matcher(input) {
    const [value] = input
    const match =
      input.meta.typeOfStringLike(value) &&
      input.meta.typeOf(value) === 'string' &&
      equals(expected, String(value)) &&
      'string'
    if (match) {
      return Matched(match, [String(value)], matcher.builder)
    }
    matcher.logger(`${matcher} failed to match [${input}]`, {
      typeOf: input?.meta.typeOf(input[0]),
      expected,
      input: input?.map(String),
    })
    return NoMatch
  }
  /** @type {(...messages: any[]) => void} */
  matcher.logger = () => {}
  /** @type {Builder<[string], string>} */
  matcher.builder = ([value]) => value
  /**
   * @template RR
   * @param {Builder<[string], RR>} builder
   * @returns {Matcher<Sexp, [string], RR>}
   */
  matcher.withBuilder = (builder) => {
    const result = /** @type {Matcher<Sexp, [string], RR>} */ (
      /** @type {unknown} */ (matcher)
    )
    result.builder = builder
    return result
  }
  enableMetaFields(matcher)

  matcher.toString = () => `string("${expected}")`
  return matcher
}

/**
 * Create a s-expression any matcher, which matches anything.
 *
 * @returns {Matcher<Sexp, any[], any>}
 */
export const any = () => {
  /**
   * @param {any} input
   */
  function matcher(input) {
    return Matched('any', input, matcher.builder)
  }
  /** @type {(...messages: any[]) => void} */
  matcher.logger = () => {}
  /** @type {Builder<any, any>} */
  matcher.builder = (value) => value
  /**
   * @template RR
   * @param {Builder<any[], RR>} builder
   * @returns {Matcher<Sexp, any[], RR>}
   */
  matcher.withBuilder = (builder) => {
    const result = /** @type {Matcher<Sexp, any[], RR>} */ (
      /** @type {unknown} */ (matcher)
    )
    result.builder = builder
    return result
  }
  enableMetaFields(matcher)

  matcher.toString = () => 'any()'
  return matcher
}

/**
 * Create a s-expression reference matcher, which allows circular references to other matchers.
 *
 * @template MT,MR
 * @template {Matcher<Sexp, MT, MR>} T
 * @returns {Matcher<Sexp, MT, MR> & {value: T}}
 */
export const reference = () => {
  /**
   * @param {Sexp} input
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
    enumerable: false,
  })
  Object.defineProperty(matcher, 'builder', {
    value: /** @type {Builder<MT, MR>} */ (/** @type {unknown} */ (() => {})),
    writable: false,
    enumerable: false,
  })

  matcher.toString = () => matcher.value?.toString() ?? 'reference()'
  Object.defineProperty(matcher, 'value', {
    /** @type {T | undefined} */
    value: undefined,
    writable: true,
  })
  return /** @type {Matcher<Sexp, MT, MR> & {value: T}} */ (matcher)
}

/**
 * Create a s-expression matcher that optionally matches an expected.
 *
 * @template MT, MR
 * @param {Matcher<Sexp, MT, MR>} expected
 * @returns {Matcher<Sexp, [Matched<MT, MR>] | [], MR | undefined>}
 */
export const maybe = (expected) => {
  /**
   * @param {Sexp} input
   */
  function matcher(input) {
    /** @type {MatchResult<MT, MR>} */
    const childResult = expected(input)
    const value = /** @type {[Matched<MT, MR>] | []} */ (
      childResult.match ? [childResult] : []
    )
    return Matched('maybe', value, matcher.builder)
  }
  /** @type {(...messages: any[]) => void} */
  matcher.logger = () => {}
  /** @type {Builder<[Matched<MT, MR>] | [], MR | undefined>} */
  matcher.builder = ([value]) => value?.build()
  /**
   * @template RR
   * @param {Builder<[Matched<MT, MR>] | [], RR>} builder
   * @returns {Matcher<Sexp, [Matched<MT, MR>] | [], RR>}
   */
  matcher.withBuilder = (builder) => {
    const result = /** @type {Matcher<Sexp, [Matched<MT, MR>] | [], RR>} */ (
      /** @type {unknown} */ (matcher)
    )
    result.builder = builder
    return result
  }
  enableMetaFields(matcher)

  matcher.toString = () => `maybe(${expected})`
  return matcher
}

/**
 * Create a s-expression matcher that the first expected child.
 *
 * @template {[...any[]]} E
 * @param {E} expected
 * @returns {Matcher<Sexp, [MatchersToMatchedUnion<E>], MatchersToBuiltUnion<E>>}
 */
export const one = (...expected) => {
  /**
   * @param {Sexp} input
   */
  function matcher(input) {
    for (const child of expected) {
      const childResult = child(input)
      if (childResult.match) {
        return Matched(
          'one',
          [/** @type {MatchersToMatchedUnion<E>} */ (childResult)],
          matcher.builder
        )
      }
    }
    matcher.logger(`${matcher} failed to match ${input}`, {
      expected: expected.map(String),
      input,
    })
    return NoMatch
  }
  /** @type {(...messages: any[]) => void} */
  matcher.logger = () => {}
  /** @type {Builder<[MatchersToMatchedUnion<E>], MatchersToBuiltUnion<E>>} */
  matcher.builder = ([value]) =>
    /** @type {MatchersToBuiltUnion<E>} */ (
      /** @type {Buildable<unknown>} */ (value).build()
    )
  /**
   * @template RR
   * @param {Builder<[MatchersToMatchedUnion<E>], RR>} builder
   * @returns {Matcher<Sexp, [MatchersToMatchedUnion<E>], RR>}
   */
  matcher.withBuilder = (builder) => {
    const result =
      /** @type {Matcher<Sexp, [MatchersToMatchedUnion<E>], RR>} */ (
        /** @type {unknown} */ (matcher)
      )
    result.builder = builder
    return result
  }
  enableMetaFields(matcher)

  matcher.toString = () => `one(${expected.join(', ')})`
  return matcher
}

/**
 * Create a s-expression matcher for a sequence of children.
 *
 * @template {any[]} E
 * @param {E} expected
 * @returns {Matcher<Sexp, MatchersToMatched<E>, MatchersToBuilt<E>>}
 */
export const seq = (...expected) => {
  /**
   * @param {Sexp} input
   */
  function matcher(input) {
    const originalInput = input

    const childResults = []
    for (const child of expected) {
      /** @type {Matched<unknown, unknown>} */
      const childResult = child(input)
      if (!childResult.match) {
        matcher.logger(`${matcher} failed to match [${originalInput}]`, {
          expected: expected.map(String),
          input: originalInput,
          unmatchedExpected: String(child),
          matched: childResults,
          unmatched: input,
        })
        return NoMatch
      }
      childResults.push(childResult)
      input = consumeInput(input, childResult)
    }
    const value = /** @type {MatchersToMatched<E>} */ (childResults)
    return Matched('seq', value, matcher.builder)
  }
  /** @type {(...messages: any[]) => void} */
  matcher.logger = () => {}
  /** @param {Buildable<unknown>[]} value */
  matcher.builder = (value) =>
    /** @type {MatchersToBuilt<E>} */ (value.map(({ build }) => build()))
  /**
   * @template RR
   * @param {Builder<MatchersToMatched<E>, RR>} builder
   * @returns {Matcher<Sexp, MatchersToMatched<E>, RR>}
   */
  matcher.withBuilder = (builder) => {
    const result = /** @type {Matcher<Sexp, MatchersToMatched<E>, RR>} */ (
      /** @type {unknown} */ (matcher)
    )
    result.builder = builder
    return result
  }
  enableMetaFields(matcher)

  matcher.toString = () => `seq(${expected.join(', ')})`
  return matcher
}

/**
 * Create a s-expression matcher that repeatedly matches an expected.
 *
 * @template T,R
 * @param {Matcher<Sexp, T, R>} expected
 * @returns {Matcher<Sexp, Matched<T, R>[], R[]>}
 */
export const some = (expected) => {
  /**
   * @param {Sexp} input
   */
  function matcher(input) {
    if (input === undefined || input.length === 0) {
      matcher.logger(`${matcher} failed to match [${input}]`, {
        expected: String(expected),
        input,
      })
      return NoMatch
    }
    const childResults = []
    let childResult = expected(input)
    while (childResult.match) {
      childResults.push(childResult)
      input = consumeInput(input, childResult)
      if (input.length === 0) {
        break
      }
      childResult = expected(input)
    }
    const match = childResults.length > 0 && 'some'
    if (match) {
      const value = /** @type {Matched<T, R>[]} */ (childResults)
      return Matched(match, value, matcher.builder)
    }
    matcher.logger(`${matcher} failed to match [${input}]`, {
      expected: String(expected),
      input,
    })
    return NoMatch
  }
  /** @type {(...messages: any[]) => void} */
  matcher.logger = () => {}
  /** @type {Builder<Matched<T, R>[], R[]>} */
  matcher.builder = (value) => value.map(({ build }) => build())
  /**
   * @template RR
   * @param {Builder<Matched<T, R>[], RR>} builder
   * @returns {Matcher<Sexp, Matched<T, R>[], RR>}
   */
  matcher.withBuilder = (builder) => {
    const result = /** @type {Matcher<Sexp, Matched<T, R>[], RR>} */ (
      /** @type {unknown} */ (matcher)
    )
    result.builder = builder
    return result
  }
  enableMetaFields(matcher)

  matcher.toString = () => `some(${expected})`
  return matcher
}
