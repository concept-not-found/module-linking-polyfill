import filter from '../filter/index.js'

export default filter(
  (node, index, parent) => parent.meta.typeOf(node) !== 'whitespace'
)
