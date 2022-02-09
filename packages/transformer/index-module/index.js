import { coreKindCollection } from '../kind-collection.js'

function resolveIndex(adapterModuleNode, kind, kindIdx) {
  const collection = coreKindCollection[kind]
  return typeof kindIdx === 'number'
    ? kindIdx
    : adapterModuleNode.symbolIndex[collection][kindIdx]
}

function directPath(moduleNode, kind, kindIdx) {
  const collection = coreKindCollection[kind]
  return [collection, resolveIndex(moduleNode, kind, kindIdx)]
}

const indexExports = (moduleNode) => {
  for (const node of moduleNode.exports) {
    Object.defineProperty(node, 'path', {
      value() {
        const {
          kindReference: { kind, kindIdx },
        } = node
        return directPath(moduleNode, kind, kindIdx)
      },
    })
  }
}

const indexDefinitions = (adapterModuleNode) => {
  const matchers = [
    ...Object.entries({ ...coreKindCollection, export: 'exports' }).map(
      ([kind, collection]) => [collection, ({ type }) => type === kind]
    ),
    ['imports', ({ import: imp }) => imp],
  ]
  for (const [collection, matcher] of matchers) {
    adapterModuleNode[collection] =
      adapterModuleNode.definitions.filter(matcher)
  }
  delete adapterModuleNode.definitions
}

const indexSymbols = (moduleNode) => {
  moduleNode.symbolIndex = {}
  for (const collection of Object.values(coreKindCollection)) {
    moduleNode.symbolIndex[collection] = {}

    for (const [kindIdx, { name }] of moduleNode[collection].entries()) {
      if (name) {
        moduleNode.symbolIndex[collection][name] = kindIdx
      }
    }
  }
}

export default (node) => {
  indexDefinitions(node)
  indexSymbols(node)
  indexExports(node)
}
