/* eslint-disable unicorn/prevent-abbreviations, unicorn/no-array-reduce */

/**
 * Composes given functions from top to bottom.
 *
 * @template T
 * @param {((input: T) => T)[]} fns
 * @returns {(input: T) => T}
 */
export default (...fns) =>
  (input) =>
    fns.reduce((input, fn) => fn(input), input)
