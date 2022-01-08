import Map from '../map-sexp-by-tag.js'
import pipe from '../pipe.js'
import MapChildren from '../map-children-sexp-by-tag.js'

const indexExports = (moduleNode) =>
  MapChildren({
    export(node) {
      moduleNode.meta.exports ??= []
      moduleNode.meta.exports.push(node)

      const [, name, [kind, kindIdx]] = node
      Object.assign(node.meta, {
        name: String(name),
        kind,
        kindIdx: Number.parseInt(kindIdx),
      })

      return node
    },
  })(moduleNode)

const kindCollection = {
  func: 'funcs',
}

const linkExports = (moduleNode) => {
  for (const exp of moduleNode.meta.exports ?? []) {
    const { kind, kindIdx } = exp.meta
    const collection = kindCollection[kind]
    const exported = moduleNode.meta[collection]?.[kindIdx]
    exp.meta.exported = exported
    exported.meta.exportedBy ??= []
    exported.meta.exportedBy.push(exp)
  }
  return moduleNode
}

const indexImports = (moduleNode) => {
  moduleNode.meta.imports ??= []
  for (const collection of Object.values(kindCollection)) {
    for (const node of moduleNode.meta[collection] ?? []) {
      if (!node.meta.import) {
        continue
      }
      moduleNode.meta.imports.push(node)

      const [, moduleName, name, imKind] = node
      const [kind, ...kindType] = imKind
      Object.assign(node.meta, {
        moduleName: String(moduleName),
        name: String(name),
        kind,
        kindType,
        imported: imKind,
      })
    }
  }
  return moduleNode
}

const indexFuncs = (moduleNode) => {
  const targetKind = 'func'
  const collection = kindCollection[targetKind]
  moduleNode.meta[collection] ??= []

  return MapChildren({
    func(node) {
      moduleNode.meta.funcs.push(node)

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

const indexCalls = (moduleNode) =>
  MapChildren({
    func(source) {
      return Map({
        call(node) {
          const [, funcIdx] = node
          source.meta.calls ??= []
          source.meta.calls.push(node)
          Object.assign(node.meta, {
            source,
            funcIdx: Number.parseInt(funcIdx),
          })
          return node
        },
      })(source)
    },
  })(moduleNode)

const linkCalls = (moduleNode) => {
  for (const func of moduleNode.meta.funcs ?? []) {
    for (const call of func.meta.calls ?? []) {
      const {
        meta: { funcIdx },
      } = call
      call.meta.target = moduleNode.meta.funcs[funcIdx]
    }
  }
  return moduleNode
}

export default pipe(
  indexFuncs,
  indexCalls,
  linkCalls,
  indexImports,
  indexExports,
  linkExports
)
