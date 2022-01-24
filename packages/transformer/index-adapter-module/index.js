import Visit from '../visit.js'
import indexModule from '../index-module/index.js'
import kindCollection, { coreKindCollection } from '../kind-collection.js'

// declared empty to avoid no-use-before-define
// eslint-disable-next-line prefer-const
let adapterModule

const indexAliases = (adapterModuleNode) => {
  for (const collection of Object.values(kindCollection)) {
    for (const node of adapterModuleNode.meta[collection]) {
      if (!node.meta.alias) {
        continue
      }

      const [, ...aliasTarget] = node
      if (node.meta.typeOf(aliasTarget[1]) === 'string') {
        let [instanceIdx, name] = aliasTarget
        const [, , [kind]] = aliasTarget
        instanceIdx = Number.parseInt(instanceIdx)
        name = String(name)
        Object.assign(node.meta, {
          instanceIdx,
          name,
          kind,
          path() {
            return ['instances', instanceIdx, 'exports', name]
          },
        })
      } else {
        let [outerIdx, kindIdx] = aliasTarget
        outerIdx = Number.parseInt(outerIdx)
        kindIdx = Number.parseInt(kindIdx)
        const [, , [kind]] = aliasTarget
        Object.assign(node.meta, {
          outerIdx,
          kind,
          kindIdx,
          path(ancestors) {
            const outerModuleIdx = ancestors.length - 1 - outerIdx
            const outerModule = ancestors[outerModuleIdx]
            const collection = kindCollection[kind]
            const aliased = outerModule.meta[collection][kindIdx]
            return [
              ...Array(outerIdx).fill('..'),
              ...aliased.meta.path(ancestors.slice(0, -outerIdx)),
            ]
          },
        })
      }
    }
  }
}

const indexModules = (adapterModuleNode) => {
  adapterModuleNode.meta.symbolIndex = {}
  const targetKind = 'module'
  const collection = kindCollection[targetKind]
  adapterModuleNode.meta[collection] = []
  adapterModuleNode.meta.symbolIndex[collection] = {}
  Visit({
    adapter(node) {
      if (node[1] === 'module') {
        const moduleIdx = adapterModuleNode.meta[collection].push(node) - 1
        const [, , symbol] = node
        if (node.meta.typeOf(symbol) === 'value') {
          node.meta.symbolIndex = true
          adapterModuleNode.meta.symbolIndex[collection][symbol] = moduleIdx
        }
      }
      Object.assign(node.meta, {
        type: 'adapter',
      })
      adapterModule(node)
    },
    module(node) {
      const moduleIdx = adapterModuleNode.meta[collection].push(node) - 1
      const [, symbol] = node
      if (node.meta.typeOf(symbol) === 'value') {
        node.meta.symbolIndex = true
        adapterModuleNode.meta.symbolIndex[collection][symbol] = moduleIdx
      }
      Object.assign(node.meta, {
        type: 'core',
      })
      indexModule(node)
    },
    import(node) {
      const [, , kindDef] = node
      const [kind, symbol] = kindDef
      if (kind === targetKind) {
        const moduleIdx = adapterModuleNode.meta[collection].push(node) - 1
        if (kindDef.meta.typeOf(symbol) === 'value') {
          node.meta.symbolIndex = true
          adapterModuleNode.meta.symbolIndex[collection][symbol] = moduleIdx
        }

        let [, , [, ...exports]] = node
        if (node.meta.symbolIndex) {
          exports = exports.slice(1)
        }

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
    },
    alias(node) {
      const [, , , kindDef] = node
      const [kind, symbol] = kindDef
      if (kind === targetKind) {
        const moduleIdx = adapterModuleNode.meta[collection].push(node) - 1
        if (kindDef.meta.typeOf(symbol) === 'value') {
          node.meta.symbolIndex = true
          adapterModuleNode.meta.symbolIndex[collection][symbol] = moduleIdx
        }

        node.meta.alias = true
      }
    },
  })(adapterModuleNode)
}

const indexKinds = (adapterModuleNode) => {
  for (const targetKind in coreKindCollection) {
    const collection = coreKindCollection[targetKind]
    adapterModuleNode.meta[collection] = []
    Visit({
      import(node) {
        const [, , [kind]] = node
        if (kind === targetKind) {
          adapterModuleNode.meta[collection].push(node)

          node.meta.import = true
        }
      },
      alias(node) {
        const [, , , [kind]] = node
        if (kind === targetKind) {
          adapterModuleNode.meta[collection].push(node)

          node.meta.alias = true
        }
      },
    })(adapterModuleNode)
  }
}

const indexExports = (adapterModuleNode) => {
  adapterModuleNode.meta.exports = []
  Visit({
    export(node) {
      adapterModuleNode.meta.exports.push(node)

      const [, , [kind]] = node
      let [, name, [, kindIdx]] = node
      name = String(name)
      if (kindIdx.startsWith('$')) {
        const collection = kindCollection[kind]
        kindIdx = adapterModuleNode.meta.symbolIndex[collection][kindIdx]
      } else {
        kindIdx = Number.parseInt(kindIdx)
      }
      Object.assign(node.meta, {
        name,
        kind,
        kindIdx,
        path(ancestors) {
          const collection = kindCollection[kind]
          const exported = adapterModuleNode.meta[collection][kindIdx]
          if (!exported.meta.import && !exported.meta.alias) {
            return [kindCollection[kind], kindIdx]
          }
          return exported.meta.path(ancestors)
        },
      })
    },
  })(adapterModuleNode)
}

const indexInstances = (adapterModuleNode) => {
  const targetKind = 'instance'
  const collection = kindCollection[targetKind]
  adapterModuleNode.meta[collection] = []
  adapterModuleNode.meta.symbolIndex[collection] = {}
  Visit({
    instance(node) {
      const instanceIdx = adapterModuleNode.meta[collection].push(node) - 1

      const [, symbol] = node
      if (node.meta.typeOf(symbol) === 'value') {
        node.meta.symbolIndex = true
        adapterModuleNode.meta.symbolIndex[collection][symbol] = instanceIdx
      }

      let [, ...instanceExpr] = node
      if (node.meta.symbolIndex) {
        instanceExpr = instanceExpr.slice(1)
      }
      if (instanceExpr.length === 1 && instanceExpr[0][0] === 'instantiate') {
        let [[, moduleIdx]] = instanceExpr
        if (moduleIdx.startsWith('$')) {
          moduleIdx = adapterModuleNode.meta.symbolIndex.modules[moduleIdx]
        } else {
          moduleIdx = Number.parseInt(moduleIdx)
        }
        const [[, , ...imports]] = instanceExpr
        Object.assign(node.meta, {
          instantiate: true,
          moduleIdx,
          imports: imports.map((imp) => {
            const [, , [kind]] = imp
            let [, name, [, kindIdx]] = imp
            name = String(name)
            if (kindIdx.startsWith('$')) {
              const collection = kindCollection[kind]
              kindIdx = adapterModuleNode.meta.symbolIndex[collection][kindIdx]
            } else {
              kindIdx = Number.parseInt(kindIdx)
            }
            Object.assign(imp.meta, {
              name,
              kind,
              kindIdx,
              path() {
                return [kindCollection[kind], kindIdx]
              },
            })
            return imp
          }),
          path(ancestors) {
            const module = adapterModuleNode.meta.modules[moduleIdx]
            if (!module.meta.import && !module.meta.alias) {
              return ['modules', moduleIdx]
            }
            return module.meta.path(ancestors)
          },
        })
      } else {
        node.meta.exports = instanceExpr.map((exp) => {
          const [, , [kind]] = exp
          let [, name, [, kindIdx]] = exp
          name = String(name)
          if (kindIdx.startsWith('$')) {
            const collection = kindCollection[kind]
            kindIdx = adapterModuleNode.meta.symbolIndex[collection][kindIdx]
          } else {
            kindIdx = Number.parseInt(kindIdx)
          }
          Object.assign(exp.meta, {
            name,
            kind,
            kindIdx,
            path(ancestors) {
              const collection = kindCollection[kind]
              const exported = adapterModuleNode.meta[collection][kindIdx]
              return exported.meta.path(ancestors)
            },
          })
          return exp
        })
      }
    },
    import(node) {
      const [, , [kind, ...exports]] = node
      if (kind === targetKind) {
        adapterModuleNode.meta[collection].push(node)

        Object.assign(node.meta, {
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
    },
    alias(node) {
      const [, , , [kind]] = node
      if (kind === targetKind) {
        adapterModuleNode.meta[collection].push(node)

        node.meta.alias = true
      }
    },
  })(adapterModuleNode)
}

const indexImports = (adapterModuleNode) => {
  adapterModuleNode.meta.imports = []
  for (const collection of Object.values(kindCollection)) {
    for (const node of adapterModuleNode.meta[collection]) {
      if (!node.meta.import) {
        continue
      }
      adapterModuleNode.meta.imports.push(node)

      let [, moduleName] = node
      moduleName = String(moduleName)
      const [, , [kind]] = node
      let [, , [, ...kindType]] = node
      if (node.meta.symbolIndex) {
        kindType = kindType.slice(1)
      }
      Object.assign(node.meta, {
        moduleName,
        kind,
        kindType,
        path() {
          return ['imports', moduleName]
        },
      })
    }
  }
}

adapterModule = (node) => {
  indexModules(node)
  indexInstances(node)
  indexKinds(node)
  indexImports(node)
  indexAliases(node)
  indexExports(node)
}

export default adapterModule
