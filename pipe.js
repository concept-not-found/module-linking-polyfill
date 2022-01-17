export default (...fns) =>
  (...input) =>
    fns.reduce((input, fn) => [fn(...input)], input)[0]

export const pipeP =
  (...fns) =>
  async (input) => {
    for (const fn of fns) {
      input = await fn(input)
    }
    return input
  }
