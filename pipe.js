export default (...fns) =>
  (...input) =>
    fns.reduce((input, fn) => [fn(...input)], input)[0]
