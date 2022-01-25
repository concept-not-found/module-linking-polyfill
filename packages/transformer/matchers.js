import matchers from 'expect/build/matchers'

function stripMetaAndMemoizeStrings(node, index, parent) {
  if (Array.isArray(node)) {
    return node.map(stripMetaAndMemoizeStrings)
  }
  if (!parent?.meta) {
    return node
  }
  switch (parent.meta.typeOf(node)) {
    case 'string':
      return `"${node}"`
    case 'block comment':
      return `(;${node};)`
    case 'line comment':
      return `;;${node}`
    default:
      return String(node)
  }
}

export function toMatchTree(received, expected) {
  received = stripMetaAndMemoizeStrings(received)
  expected = stripMetaAndMemoizeStrings(expected)
  return matchers.default.toMatchObject(received, expected)
}
