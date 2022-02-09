/* eslint-disable unicorn/consistent-function-scoping */
import { inspect } from 'node:util'

const consumedCache = new WeakMap()
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
      : result.value.reduce((total, child) => {
          return total + calculateConsumed(child)
        }, 0)
  consumedCache.set(result, consumed)
  return consumed
}

export const sexp = (...expected) => {
  function matcher(container) {
    let [input] = container
    const originalInput = input
    const typeOf = container.meta.typeOf(input)
    if (typeOf !== 'sexp') {
      matcher.logger(`${matcher} failed to match [${input}]`, {
        typeOf,
        expected: expected.map(String),
        input: input && [...input],
      })
      return {
        match: false,
      }
    }
    const value = []
    for (const child of expected) {
      const childResult = child(input)
      if (!childResult.match) {
        matcher.logger(`${matcher} failed to match [${originalInput}]`, {
          expected: expected.map(String),
          input: [...originalInput],
          unmatchedExpected: String(child),
          matched: value,
          unmatched: [...input],
        })
        return {
          match: false,
        }
      }
      value.push(childResult)
      const { meta } = input
      input = input.slice(calculateConsumed(childResult))
      Object.defineProperty(input, 'meta', { value: meta })
    }
    const match = input.length === 0 && value.length > 0 && 'sexp'
    if (match) {
      const result = {
        match,
        value,
      }
      Object.defineProperty(result, 'build', {
        value: () => matcher.builder(result.value, input),
      })
      return result
    }
    matcher.logger(`${matcher} failed to match [${originalInput}]`, {
      expected: expected.map(String),
      input: [...originalInput],
      matched: value,
      unmatched: [...input],
    })
    return {
      match: false,
    }
  }
  Object.defineProperty(matcher, 'logger', {
    value: () => {},
    writable: true,
  })
  Object.defineProperty(matcher, 'builder', {
    value: (value) => value.map(({ build }) => build()),
    writable: true,
  })

  matcher.toString = matcher[inspect.custom] = () =>
    `sexp(${expected.join(', ')})`

  return matcher
}

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

export const value = (expected) => {
  function matcher(input) {
    const [value] = input
    const match =
      value !== undefined &&
      input.meta.typeOf(value) === 'value' &&
      equals(expected, value) &&
      'value'
    if (match) {
      const result = {
        match,
        value: [value],
      }
      Object.defineProperty(result, 'build', {
        value: () => matcher.builder(result.value),
      })
      return result
    } else {
      matcher.logger(`${matcher} failed to match [${input}]`, {
        typeOf: input.meta.typeOf(value),
        expected,
        input: [String(value)],
      })
      return {
        match: false,
      }
    }
  }
  Object.defineProperty(matcher, 'logger', {
    value: () => {},
    writable: true,
  })
  Object.defineProperty(matcher, 'builder', {
    value: ([value]) => value,
    writable: true,
  })

  matcher.toString = matcher[inspect.custom] = () => `value("${expected}")`
  return matcher
}

export const string = (expected) => {
  function matcher(input) {
    const [value] = input
    const match =
      value !== undefined &&
      input.meta.typeOf(value) === 'string' &&
      equals(expected, String(value)) &&
      'string'
    if (match) {
      const result = {
        match,
        value: [String(value)],
      }
      Object.defineProperty(result, 'build', {
        value: () => matcher.builder(result.value),
      })
      return result
    } else {
      matcher.logger(`${matcher} failed to match [${input}]`, {
        typeOf: input.meta.typeOf(value),
        expected,
        input: [String(value)],
      })
      return {
        match: false,
      }
    }
  }
  Object.defineProperty(matcher, 'logger', {
    value: () => {},
    writable: true,
  })
  Object.defineProperty(matcher, 'builder', {
    value: ([value]) => value,
    writable: true,
  })

  matcher.toString = matcher[inspect.custom] = () => `string("${expected}")`
  return matcher
}

export const any = () => {
  function matcher(input) {
    const result = {
      match: 'any',
      value: [...input],
    }
    Object.defineProperty(result, 'build', {
      value: () => matcher.builder(result.value),
    })
    return result
  }
  Object.defineProperty(matcher, 'builder', {
    value: (value) => value,
    writable: true,
  })

  matcher.toString = matcher[inspect.custom] = () => 'any()'
  return matcher
}

export const reference = () => {
  function matcher(input) {
    if (!matcher.value) {
      throw new Error('reference.value has not been set yet')
    }
    return matcher.value(input)
  }
  Object.defineProperty(matcher, 'logger', {
    set() {
      throw new Error(
        'reference does not support logger. set the logger of the underlying value instead'
      )
    },
  })
  Object.defineProperty(matcher, 'builder', {
    set() {
      throw new Error(
        'reference does not support builder. set the builder of the underlying value instead'
      )
    },
  })

  matcher.toString = matcher[inspect.custom] = () =>
    matcher.value?.[inspect.custom]() ?? 'reference()'
  Object.defineProperty(matcher, 'value', {
    value: undefined,
    writable: true,
  })
  return matcher
}

export const maybe = (expected) => {
  function matcher(input) {
    const childResult = expected(input)
    const result = childResult.match
      ? {
          match: 'maybe',
          value: [childResult],
        }
      : {
          match: 'maybe',
          value: [],
        }
    Object.defineProperty(result, 'build', {
      value: () => matcher.builder(result.value),
    })
    return result
  }
  Object.defineProperty(matcher, 'builder', {
    value: ([value]) => value?.build(),
    writable: true,
  })

  matcher.toString = matcher[inspect.custom] = () => `maybe(${expected})`
  return matcher
}

export const one = (...expected) => {
  function matcher(input) {
    for (const child of expected) {
      const childResult = child(input)
      if (childResult.match) {
        const result = {
          match: 'one',
          value: [childResult],
        }
        Object.defineProperty(result, 'build', {
          value: () => matcher.builder(result.value),
        })
        return result
      }
    }
    matcher.logger(`${matcher} failed to match ${input}`, {
      expected: expected.map(String),
      input: [...input],
    })
    return {
      match: false,
    }
  }
  Object.defineProperty(matcher, 'logger', {
    value: () => {},
    writable: true,
  })
  Object.defineProperty(matcher, 'builder', {
    value: ([value]) => value.build(),
    writable: true,
  })

  matcher.toString = matcher[inspect.custom] = () =>
    `one(${expected.join(', ')})`
  return matcher
}

export const seq = (...expected) => {
  function matcher(input) {
    const originalInput = input
    const value = []
    for (const child of expected) {
      const childResult = child(input)
      if (!childResult.match) {
        matcher.logger(`${matcher} failed to match [${originalInput}]`, {
          expected: expected.map(String),
          input: [...originalInput],
          unmatchedExpected: String(child),
          matched: value,
          unmatched: [...input],
        })
        return {
          match: false,
        }
      }
      value.push(childResult)
      const { meta } = input
      input = input.slice(calculateConsumed(childResult))
      Object.defineProperty(input, 'meta', { value: meta })
    }
    const result = {
      match: 'seq',
      value,
    }
    Object.defineProperty(result, 'build', {
      value: () => matcher.builder(result.value),
    })
    return result
  }
  Object.defineProperty(matcher, 'logger', {
    value: () => {},
    writable: true,
  })
  Object.defineProperty(matcher, 'builder', {
    value: (value) => value.map(({ build }) => build()),
    writable: true,
  })

  matcher.toString = matcher[inspect.custom] = () =>
    `seq(${expected.join(', ')})`
  return matcher
}

export const some = (expected) => {
  function matcher(input) {
    if (input.length === 0) {
      matcher.logger(`${matcher} failed to match [${input}]`, {
        expected: String(expected),
        input: [...input],
      })
      return {
        match: false,
      }
    }
    const value = []
    let childResult = expected(input)
    while (childResult.match) {
      value.push(childResult)
      const { meta } = input
      input = input.slice(calculateConsumed(childResult))
      if (input.length === 0) {
        break
      }
      Object.defineProperty(input, 'meta', { value: meta })
      childResult = expected(input)
    }
    const match = value.length > 0 && 'some'
    if (match) {
      const result = {
        match,
        value,
      }
      Object.defineProperty(result, 'build', {
        value: () => matcher.builder(result.value),
      })
      return result
    }
    matcher.logger(`${matcher} failed to match [${input}]`, {
      expected: String(expected),
      input: [...input],
    })
    return {
      match: false,
    }
  }
  Object.defineProperty(matcher, 'logger', {
    value: () => {},
    writable: true,
  })
  Object.defineProperty(matcher, 'builder', {
    value: (value) => value.map(({ build }) => build()),
    writable: true,
  })

  matcher.toString = matcher[inspect.custom] = () => `some(${expected})`
  return matcher
}
