import { when, defined, rest } from 'patcom'

export const sexp = (...expected) =>
  when({ type: 'sexp', value: expected, rest }, ({ value }) => value)

export const value = (expected = defined) =>
  when({ type: 'value', value: expected }, ({ value }) => value)

export const string = (expected = defined) =>
  when({ type: 'string', value: expected }, ({ value }) => value)
