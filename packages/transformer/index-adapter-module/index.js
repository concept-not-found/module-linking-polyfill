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
  const targetKind = 'module'
  const collection = kindCollection[targetKind]
  adapterModuleNode.meta[collection] = []
  Visit({
    adapter(node) {
      if (node[1] === 'module') {
        adapterModuleNode.meta[collection].push(node)
      }
      Object.assign(node.meta, {
        type: 'adapter',
      })
      adapterModule(node)
    },
    module(node) {
      adapterModuleNode.meta[collection].push(node)
      Object.assign(node.meta, {
        type: 'core',
      })
      indexModule(node)
    },
    import(node) {
      const [, , [kind, ...exports]] = node
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

const indexKinds = (adapterModuleNode) => {
  for (const targetKind in coreKindCollection) {
    const collection = kindCollection[targetKind]
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

      let [, name, [, kindIdx]] = node
      name = String(name)
      kindIdx = Number.parseInt(kindIdx)
      const [, , [kind]] = node
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
  Visit({
    instance(node) {
      adapterModuleNode.meta[collection].push(node)
      const [, ...instanceExpr] = node
      if (instanceExpr.length === 1 && instanceExpr[0][0] === 'instantiate') {
        let [[, moduleIdx]] = instanceExpr
        moduleIdx = Number.parseInt(moduleIdx)
        const [[, , ...imports]] = instanceExpr
        Object.assign(node.meta, {
          instantiate: true,
          moduleIdx,
          imports: imports.map((imp) => {
            let [, name, [, kindIdx]] = imp
            name = String(name)
            kindIdx = Number.parseInt(kindIdx)
            const [, , [kind]] = imp
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
          let [, name, [, kindIdx]] = exp
          name = String(name)
          kindIdx = Number.parseInt(kindIdx)
          const [, , [kind]] = exp
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
      const [, , [kind, ...kindType]] = node
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
