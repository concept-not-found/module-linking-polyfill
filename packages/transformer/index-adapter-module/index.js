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
        Object.assign(node.meta, {
          path() {
            let [instanceIdx, name] = aliasTarget
            if (instanceIdx.startsWith('$')) {
              instanceIdx =
                adapterModuleNode.meta.symbolIndex.instances[instanceIdx]
            } else {
              instanceIdx = Number.parseInt(instanceIdx)
            }
            name = String(name)
            return ['instances', instanceIdx, 'exports', name]
          },
        })
      } else {
        Object.assign(node.meta, {
          path(ancestors) {
            const [, , [kind]] = aliasTarget
            let [outerIdx, kindIdx] = aliasTarget
            outerIdx = Number.parseInt(outerIdx)
            const outerModuleIdx = ancestors.length - 1 - outerIdx
            const outerModule = ancestors[outerModuleIdx]
            const collection = kindCollection[kind]
            if (kindIdx.startsWith('$')) {
              const collection = kindCollection[kind]
              kindIdx = outerModule.meta.symbolIndex[collection][kindIdx]
            } else {
              kindIdx = Number.parseInt(kindIdx)
            }
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
        Object.assign(node.meta, {
          type: 'adapter',
          path() {
            return ['modules', moduleIdx]
          },
        })
        adapterModule(node)
      }
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
        path() {
          return ['modules', moduleIdx]
        },
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

const indexKindSymbols = (adapterModuleNode) => {
  for (const targetKind in coreKindCollection) {
    const collection = coreKindCollection[targetKind]
    adapterModuleNode.meta.symbolIndex[collection] = {}

    adapterModuleNode.meta[collection].forEach((node, kindIdx) => {
      if (node.meta.import) {
        const [, , kindDef] = node
        const [, symbol] = kindDef
        if (kindDef.meta.typeOf(symbol) === 'value') {
          node.meta.symbolIndex = true
          adapterModuleNode.meta.symbolIndex[collection][symbol] = kindIdx
        }
      } else if (node.meta.alias) {
        const [, , , kindDef] = node
        const [, symbol] = kindDef
        if (kindDef.meta.typeOf(symbol) === 'value') {
          adapterModuleNode.meta.symbolIndex[collection][symbol] = kindIdx
        }
      }
    })
  }
}

const indexExports = (adapterModuleNode) => {
  adapterModuleNode.meta.exports = []
  Visit({
    export(node) {
      adapterModuleNode.meta.exports.push(node)

      const [, , [kind]] = node
      let [, name] = node
      name = String(name)
      Object.assign(node.meta, {
        name,
        kind,
        path(ancestors) {
          const collection = kindCollection[kind]
          let [, , [, kindIdx]] = node
          if (kindIdx.startsWith('$')) {
            kindIdx = adapterModuleNode.meta.symbolIndex[collection][kindIdx]
          } else {
            kindIdx = Number.parseInt(kindIdx)
          }
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
      node.meta.path = () => {
        return ['instances', instanceIdx]
      }

      let [, ...instanceExpr] = node
      if (node.meta.symbolIndex) {
        instanceExpr = instanceExpr.slice(1)
      }
      if (instanceExpr.length === 1 && instanceExpr[0][0] === 'instantiate') {
        const [[, , ...imports]] = instanceExpr
        Object.assign(node.meta, {
          instantiate: true,
          modulePath(ancestors) {
            let [[, moduleIdx]] = instanceExpr
            if (moduleIdx.startsWith('$')) {
              moduleIdx = adapterModuleNode.meta.symbolIndex.modules[moduleIdx]
            } else {
              moduleIdx = Number.parseInt(moduleIdx)
            }
            const module = adapterModuleNode.meta.modules[moduleIdx]
            if (!module.meta.import && !module.meta.alias) {
              return ['modules', moduleIdx]
            }
            return module.meta.path(ancestors)
          },
          imports: imports.map((imp) => {
            const [, , [kind]] = imp
            let [, name] = imp
            name = String(name)
            Object.assign(imp.meta, {
              name,
              kind,
              path(ancestors) {
                let [, , [, kindIdx]] = imp
                const collection = kindCollection[kind]
                if (kindIdx.startsWith('$')) {
                  kindIdx =
                    adapterModuleNode.meta.symbolIndex[collection][kindIdx]
                } else {
                  kindIdx = Number.parseInt(kindIdx)
                }
                const imported = adapterModuleNode.meta[collection][kindIdx]
                return imported.meta.path(ancestors)
              },
            })
            return imp
          }),
        })
      } else {
        node.meta.exports = instanceExpr.map((exp) => {
          const [, , [kind]] = exp
          let [, name] = exp
          name = String(name)
          Object.assign(exp.meta, {
            name,
            kind,
            path(ancestors) {
              let [, , [, kindIdx]] = exp
              const collection = kindCollection[kind]
              if (kindIdx.startsWith('$')) {
                kindIdx =
                  adapterModuleNode.meta.symbolIndex[collection][kindIdx]
              } else {
                kindIdx = Number.parseInt(kindIdx)
              }
              const exported = adapterModuleNode.meta[collection][kindIdx]
              return exported.meta.path(ancestors)
            },
          })
          return exp
        })
      }
    },
    import(node) {
      const [, , kindDef] = node
      const [kind, symbol] = kindDef
      if (kind === targetKind) {
        const instanceIdx = adapterModuleNode.meta[collection].push(node) - 1
        if (kindDef.meta.typeOf(symbol) === 'value') {
          node.meta.symbolIndex = true
          adapterModuleNode.meta.symbolIndex[collection][symbol] = instanceIdx
        }

        let [, , [, ...exports]] = node
        if (node.meta.symbolIndex) {
          exports = exports.slice(1)
        }

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
      const [, , , kindDef] = node
      const [kind, symbol] = kindDef
      if (kind === targetKind) {
        const instanceIdx = adapterModuleNode.meta[collection].push(node) - 1
        if (kindDef.meta.typeOf(symbol) === 'value') {
          node.meta.symbolIndex = true
          adapterModuleNode.meta.symbolIndex[collection][symbol] = instanceIdx
        }

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
  indexKinds(node)
  indexKindSymbols(node)
  indexInstances(node)
  indexImports(node)
  indexAliases(node)
  indexExports(node)
}

export default adapterModule
