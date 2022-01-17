export default (closure) => (node, index, parent) => {
  function postorder(node, index, parent) {
    if (node instanceof Array) {
      const result = node.map(postorder)
      result.meta = node.meta
      return closure(result, index, parent)
    } else {
      return closure(node, index, parent)
    }
  }
  return postorder(node, index, parent)
}
