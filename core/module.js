import Visit from '../visit.js'
import { coreKindCollection } from './kind-collection.js'

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
          return [coreKindCollection[kind], kindIdx]
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

const indexKinds = (moduleNode) => {
  for (const targetKind in coreKindCollection) {
    const collection = coreKindCollection[targetKind]
    moduleNode.meta[collection] = []

    Visit({
      [targetKind]: (node) => {
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
}

export default (node) => {
  indexKinds(node)
  indexImports(node)
  indexExports(node)
}
