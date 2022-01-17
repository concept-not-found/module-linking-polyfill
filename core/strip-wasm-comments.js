import filter from '../filter/index.js'

export default filter(
  (node, index, parent) =>
    !['block comment', 'line comment'].includes(parent.meta.typeOf(node))
)
