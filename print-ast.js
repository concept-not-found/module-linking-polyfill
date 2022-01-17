export default (pretty = false) =>
  (node) => {
    const output = []
    const nodeErrors = []
    let previousType
    function printNode(node) {
      const { type, children = [], value = '', errors = [] } = node
      nodeErrors.push(...errors)
      switch (type) {
        case 'root':
          children.map(printNode)
          break
        case 'sexp':
          previousType = undefined
          output.push('(')
          children.map(printNode)
          output.push(')')
          break
        case 'string':
          output.push('"')
          output.push(value)
          output.push('"')
          break
        case 'block comment':
          output.push('(;')
          output.push(value)
          output.push(';)')
          break
        case 'line comment':
          output.push(';;')
          output.push(value)
          break
        case 'whitespace':
          output.push(value)
          break
        case 'value':
          if (previousType === 'value') {
            output.push(' ')
          }
          output.push(value)
          break
        default:
          throw new Error(`unsupported ast node of type ${type}`)
      }
      previousType = type
    }
    printNode(node)
    if (nodeErrors.length !== 0) {
      return nodeErrors.join('\n')
    }
    return output.join('')
  }
