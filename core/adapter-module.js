import pipe from '../pipe.js'
import MapChildren from '../map-children-sexp-by-tag.js'
import coreModule from './module.js'

// declared empty to avoid no-use-before-define
// eslint-disable-next-line prefer-const
let adapterModule

const kindCollection = {
  instance: 'instances',
  func: 'funcs',
  module: 'modules',
  memory: 'memories',
}

const indexAliases = (adapterModuleNode) => {
  adapterModuleNode.meta.aliases = []
  for (const collection of Object.values(kindCollection)) {
    if (!adapterModuleNode.meta[collection]) {
      continue
    }
    for (const node of adapterModuleNode.meta[collection]) {
      if (!node.meta.alias) {
        continue
      }
      adapterModuleNode.meta.aliases.push(node)

      const [, ...aliasTarget] = node
      if (node.meta.typeOf(aliasTarget[1]) === 'string') {
        const [instanceIdx, name, [kind]] = aliasTarget
        Object.assign(node.meta, {
          type: 'instance-export',
          instanceIdx: Number.parseInt(instanceIdx),
          instance: adapterModuleNode.meta.instances[instanceIdx],
          name: String(name),
          kind,
        })
      } else {
        const [outerIdx, kindIdx, [kind]] = aliasTarget
        Object.assign(node.meta, {
          type: 'outer',
          outerIdx: Number.parseInt(outerIdx),
          kind,
          kindIdx: Number.parseInt(kindIdx),
        })
      }
    }
  }
  return adapterModuleNode
}

const indexModules = (adapterModuleNode) => {
  const targetKind = 'module'
  const collection = kindCollection[targetKind]
  adapterModuleNode.meta[collection] = []
  return MapChildren({
    adapter(node, index, parent) {
      if (node[1] === 'module') {
        adapterModuleNode.meta[collection].push(node)
      }
      Object.assign(node.meta, {
        type: 'adapter',
      })
      return adapterModule(node, index, parent)
    },
    module(node, index, parent) {
      adapterModuleNode.meta[collection].push(node)
      Object.assign(node.meta, {
        type: 'core',
      })
      return coreModule(node, index, parent)
    },
    import(node) {
      const [, , imKind] = node
      const [kind, ...exports] = imKind
      if (kind === targetKind) {
        adapterModuleNode.meta[collection].push(node)

        Object.assign(node.meta, {
          type: 'adapter',
          import: true,
          exports: exports.map((exp) => {
            const [, name, [kind, ...kindType]] = exp
            Object.assign(exp.meta, {
              name: String(name),
              kind,
              kindType,
            })
            return exp
          }),
        })
      }
      return node
    },
    alias(node) {
      const [, , , [kind]] = node
      if (kind === targetKind) {
        adapterModuleNode.meta[collection].push(node)

        node.meta.alias = true
      }

      return node
    },
  })(adapterModuleNode)
}

const indexFuncs = (adapterModuleNode) => {
  const targetKind = 'func'
  const collection = kindCollection[targetKind]
  adapterModuleNode.meta[collection] = []
  return MapChildren({
    import(node) {
      const [, , imKind] = node
      const [kind] = imKind
      if (kind === targetKind) {
        adapterModuleNode.meta[collection].push(node)

        node.meta.import = true
      }
      return node
    },
    alias(node) {
      const [, , , [kind]] = node
      if (kind === targetKind) {
        adapterModuleNode.meta[collection].push(node)

        node.meta.alias = true
      }

      return node
    },
  })(adapterModuleNode)
}

const indexExports = (adapterModuleNode) => {
  adapterModuleNode.meta.exports = []
  return MapChildren({
    export(node) {
      adapterModuleNode.meta.exports.push(node)

      const [, name, [kind, kindIdx]] = node
      Object.assign(node.meta, {
        export: true,
        name: String(name),
        kind,
        kindIdx: Number.parseInt(kindIdx),
      })

      return node
    },
  })(adapterModuleNode)
}

const indexInstances = (adapterModuleNode) => {
  const targetKind = 'instance'
  const collection = kindCollection[targetKind]
  adapterModuleNode.meta[collection] = []
  return MapChildren({
    instance(node) {
      adapterModuleNode.meta[collection].push(node)
      const [, ...instanceExpr] = node
      if (instanceExpr.length === 1 && instanceExpr[0][0] === 'instantiate') {
        const [[, moduleIdx, ...imports]] = instanceExpr
        Object.assign(node.meta, {
          moduleIdx: Number.parseInt(moduleIdx),
          imports: imports.map((node) => {
            const [, name, [kind, kindIdx]] = node
            return {
              name: String(name),
              kind,
              kindIdx: Number.parseInt(kindIdx),
            }
          }),
        })
      } else {
        node.meta.exports = instanceExpr.map((exp) => {
          const [, name, [kind, kindIdx]] = exp
          Object.assign(exp.meta, {
            export: true,
            name: String(name),
            kind,
            kindIdx: Number.parseInt(kindIdx),
          })
          return exp
        })
      }
      return node
    },
    import(node) {
      const [, , imKind] = node
      const [kind, ...exports] = imKind
      if (kind === targetKind) {
        adapterModuleNode.meta[collection].push(node)

        Object.assign(node.meta, {
          import: true,
          exports: exports.map((exp) => {
            const [, name, [kind, ...kindType]] = exp
            Object.assign(exp.meta, {
              export: true,
              name: String(name),
              kind,
              kindType,
            })
            return exp
          }),
        })
      }
      return node
    },
  })(adapterModuleNode)
}

const indexImports = (adapterModuleNode) => {
  adapterModuleNode.meta.imports = []
  for (const collection of Object.values(kindCollection)) {
    if (!adapterModuleNode.meta[collection]) {
      continue
    }
    for (const node of adapterModuleNode.meta[collection]) {
      if (!node.meta.import) {
        continue
      }
      adapterModuleNode.meta.imports.push(node)

      const [, moduleName, [kind, ...kindType]] = node
      Object.assign(node.meta, {
        moduleName: String(moduleName),
        kind,
        kindType,
      })
    }
  }
  return adapterModuleNode
}

adapterModule = pipe(
  indexModules,
  indexFuncs,
  indexInstances,
  indexImports,
  indexAliases,
  indexExports
)

export default adapterModule
