import pipe from '../pipe.js'
import MapChildren from '../map-children-sexp-by-tag.js'

const kindCollection = {
  func: 'funcs',
  memory: 'memories',
}

const indexExports = (moduleNode) => {
  moduleNode.meta.exports = []
  return MapChildren({
    export(node) {
      moduleNode.meta.exports.push(node)

      let [, name, [, kindIdx]] = node
      name = String(name)
      kindIdx = Number.parseInt(kindIdx)
      const [, , [kind]] = node
      Object.assign(node.meta, {
        name,
        kind,
        kindIdx,
        path() {
          return [kindCollection[kind], kindIdx]
        },
      })

      return node
    },
  })(moduleNode)
}

const indexImports = (moduleNode) => {
  moduleNode.meta.imports = []
  for (const collection of Object.values(kindCollection)) {
    for (const node of moduleNode.meta[collection]) {
      if (!node.meta.import) {
        continue
      }
      moduleNode.meta.imports.push(node)

      const [, moduleName, name, [kind, ...kindType]] = node
      Object.assign(node.meta, {
        moduleName: String(moduleName),
        name: String(name),
        kind,
        kindType,
      })
    }
  }
  return moduleNode
}

const indexFuncs = (moduleNode) => {
  const targetKind = 'func'
  const collection = kindCollection[targetKind]
  moduleNode.meta[collection] = []

  return MapChildren({
    func(node) {
      moduleNode.meta[collection].push(node)

      return node
    },
    import(node) {
      const [, , , imKind] = node
      const [kind] = imKind
      if (kind === targetKind) {
        moduleNode.meta[collection].push(node)

        node.meta.import = true
      }
      return node
    },
  })(moduleNode)
}

const indexMemories = (moduleNode) => {
  const targetKind = 'memory'
  const collection = kindCollection[targetKind]
  moduleNode.meta[collection] = []

  return MapChildren({
    memory(node) {
      moduleNode.meta[collection].push(node)

      return node
    },
    import(node) {
      const [, , , imKind] = node
      const [kind] = imKind
      if (kind === targetKind) {
        moduleNode.meta[collection].push(node)

        node.meta.import = true
      }
      return node
    },
  })(moduleNode)
}

export default pipe(indexFuncs, indexMemories, indexImports, indexExports)
