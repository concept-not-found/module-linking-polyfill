import filter from './index.js'

describe('filter', () => {
  test('works like regular filter over array', () => {
    const input = [1, 2, 3]
    expect(filter((x) => x > 2)(input)).toMatchObject([3])
  })

  test('recursive into nested arrays', () => {
    const input = [1, 2, 3, [1, 2, 3, 4]]
    expect(filter((x) => x > 2)(input)).toMatchObject([3, [3, 4]])
  })

  test('test has access to index', () => {
    const input = [1, 2, 3, [1, 2, 3, 4]]
    expect(filter((x, index) => x > 2 || index === 0)(input)).toMatchObject([
      1,
      3,
      [1, 3, 4],
    ])
  })

  test('test has access to parent', () => {
    const input = [1, 2, [1, 2, 3, 4]]
    expect(
      filter((x, index, parent) => x > 2 && parent.length === 4)(input)
    ).toMatchObject([[3, 4]])
  })
})
