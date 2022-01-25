const trim = (node) => {
  if (Array.isArray(node)) {
    const children = node
      .filter(
        (child) =>
          !['block comment', 'line comment', 'whitespace'].includes(
            node.meta.typeOf(child)
          )
      )
      .map(trim)
    const types = new WeakMap()
    for (const child of children) {
      const type = Array.isArray(child) ? 'sexp' : node.meta.typeOf(child)
      if (type !== 'value') {
        types.set(child, type)
      }
    }
    children.meta = {
      ...node.meta,
      typeOf(value) {
        return types.get(value) ?? 'value'
      },
    }
    return children
  } else {
    return node
  }
}

export default trim
