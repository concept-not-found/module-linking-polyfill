import Visit from '../visit.js'
import { coreKindCollection } from '../kind-collection.js'

const indexExports = (moduleNode) => {
  moduleNode.meta.exports = []
  Visit({
    export(node) {
      moduleNode.meta.exports.push(node)

      const [, , [kind]] = node
      let [, name] = node
      name = String(name)
      Object.assign(node.meta, {
        name,
        kind,
        path() {
          let [, , [, kindIdx]] = node
          const collection = coreKindCollection[kind]
          kindIdx = kindIdx.startsWith('$')
            ? moduleNode.meta.symbolIndex[collection][kindIdx]
            : Number.parseInt(kindIdx)
          return [collection, kindIdx]
        },
      })
    },
  })(moduleNode)
}

const indexImports = (moduleNode) => {
  moduleNode.meta.imports = []
  for (const collection of Object.values(coreKindCollection)) {
    for (const node of moduleNode.meta[collection]) {
      if (!node.meta.import) {
        continue
      }
      moduleNode.meta.imports.push(node)

      const [, moduleName, name, [kind]] = node
      let [, , , [, ...kindType]] = node
      if (node.meta.symbolIndex) {
        kindType = kindType.slice(1)
      }
      Object.assign(node.meta, {
        moduleName: String(moduleName),
        name: String(name),
        kind,
      })
      // TODO consume kindType
    }
  }
}

const indexKinds = (moduleNode) => {
  for (const targetKind in coreKindCollection) {
    const collection = coreKindCollection[targetKind]
    moduleNode.meta[collection] = []

    Visit({
      [targetKind]: (node) => {
        moduleNode.meta[collection].push(node)
      },
      import(node) {
        const [, , , [kind]] = node
        if (kind === targetKind) {
          moduleNode.meta[collection].push(node)

          node.meta.import = true
        }
      },
    })(moduleNode)
  }
}

const indexKindSymbols = (moduleNode) => {
  moduleNode.meta.symbolIndex = {}
  for (const targetKind in coreKindCollection) {
    const collection = coreKindCollection[targetKind]
    moduleNode.meta.symbolIndex[collection] = {}

    for (const [kindIdx, node] of moduleNode.meta[collection].entries()) {
      if (node.meta.import) {
        const [, , , kindDef] = node
        const [, symbol] = kindDef
        if (kindDef.meta.typeOf(symbol) === 'value') {
          node.meta.symbolIndex = true
          moduleNode.meta.symbolIndex[collection][symbol] = kindIdx
        }
      } else {
        const [, symbol] = node
        if (node.meta.typeOf(symbol) === 'value') {
          moduleNode.meta.symbolIndex[collection][symbol] = kindIdx
        }
      }
    }
  }
}

export default (node) => {
  indexKinds(node)
  indexKindSymbols(node)
  indexImports(node)
  indexExports(node)
}
