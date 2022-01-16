const filter = (test) => (node) => {
  if (node instanceof Array) {
    const result = node
      .filter(
        (child, index, parent) =>
          child instanceof Array || test(child, index, parent)
      )
      .map(filter(test))
    result.meta = node.meta
    return result
  } else {
    return node
  }
}

export default filter
