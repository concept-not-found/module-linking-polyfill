import Visit from '../visit.js'

const kindCollection = {
  func: 'funcs',
  memory: 'memories',
}

const indexExports = (moduleNode) => {
  moduleNode.meta.exports = []
  Visit({
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
}

const indexFuncs = (moduleNode) => {
  const targetKind = 'func'
  const collection = kindCollection[targetKind]
  moduleNode.meta[collection] = []

  Visit({
    func(node) {
      moduleNode.meta[collection].push(node)
    },
    import(node) {
      const [, , , imKind] = node
      const [kind] = imKind
      if (kind === targetKind) {
        moduleNode.meta[collection].push(node)

        node.meta.import = true
      }
    },
  })(moduleNode)
}

const indexMemories = (moduleNode) => {
  const targetKind = 'memory'
  const collection = kindCollection[targetKind]
  moduleNode.meta[collection] = []

  Visit({
    memory(node) {
      moduleNode.meta[collection].push(node)
    },
    import(node) {
      const [, , , imKind] = node
      const [kind] = imKind
      if (kind === targetKind) {
        moduleNode.meta[collection].push(node)

        node.meta.import = true
      }
    },
  })(moduleNode)
}

export default (node) => {
  indexFuncs(node)
  indexMemories(node)
  indexImports(node)
  indexExports(node)
}
