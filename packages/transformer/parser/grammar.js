import { ValueMatcher, when, defined, rest } from 'patcom'

export const root = (expected) =>
  when({ type: 'sexp', value: [expected] }, ({ value: [value] }) => value)

export const sexp = (...expected) =>
  when({ type: 'sexp', value: expected, rest }, ({ value }) => value)

export const value = (expected = defined) =>
  when({ type: 'value', value: expected }, ({ value }) => value)

export const string = (expected = defined) =>
  when({ type: 'string', value: expected }, ({ value }) => value)

export const reference = () => {
  const referenceMatcher = ValueMatcher((value) => {
    if (!referenceMatcher.matcher) {
      throw new Error('reference.matcher has not been set yet')
    }
    return referenceMatcher.matcher(value)
  })

  Object.defineProperty(referenceMatcher, 'matcher', {
    matcher: undefined,
    writable: true,
  })
  return referenceMatcher
}
