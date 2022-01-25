/* eslint-disable unicorn/prevent-abbreviations, unicorn/no-array-reduce */

export default (...fns) =>
  (...input) =>
    fns.reduce((input, fn) => [fn(...input)], input)[0]
