import pipe from '../pipe.js'
import MapChildren from '../map-children-sexp-by-tag.js'
import coreModule from './module.js'

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
          name: String(name),
          kind,
        })
      } else {
        const [outerIdx, idx, [kind]] = aliasTarget
        Object.assign(node.meta, {
          type: 'outer',
          outerIdx: Number.parseInt(outerIdx),
          idx: Number.parseInt(idx),
          kind,
        })
      }
    }
  }
  return adapterModuleNode
}
const linkAliases = (adapterModuleNode) => {
  for (const alias of adapterModuleNode.meta.aliases) {
    switch (alias.meta.type) {
      case 'instance-export': {
        const { instanceIdx } = alias.meta
        const instance = adapterModuleNode.meta.instances[instanceIdx]
        Object.assign(alias.meta, {
          instance,
        })
        break
      }
      case 'outer': {
        throw new Error('outer alias not implemented')
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
    adapter(node) {
      if (node[1] === 'module') {
        adapterModuleNode.meta[collection].push(node)
      }
      Object.assign(node.meta, {
        type: 'adapter',
      })
      return node
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
        name: String(name),
        kind,
        kindIdx: Number.parseInt(kindIdx),
      })

      return node
    },
  })(adapterModuleNode)
}

const linkExports = (adapterModuleNode) => {
  for (const exp of adapterModuleNode.meta.exports) {
    const { kind, kindIdx } = exp.meta
    const collection = kindCollection[kind]
    const exported = adapterModuleNode.meta[collection][kindIdx]
    exp.meta.exported = exported
  }
  return adapterModuleNode
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

const linkInstanceInstantiate = (adapterModuleNode) => {
  for (const instance of adapterModuleNode.meta.instances) {
    const { moduleIdx } = instance.meta
    if (moduleIdx === undefined) {
      continue
    }
    const module = adapterModuleNode.meta.modules[moduleIdx]
    // const instantiatedImports = module.meta.imports.map((moduleImport) => {
    //   const { kind, kindIdx } = instance.meta.imports.find(
    //     ({ name }) => name === moduleImport.meta.moduleName
    //   )
    //   const collection = kindCollection[kind]
    //   const imp = adapterModuleNode.meta[collection][kindIdx]
    //   return imp
    // })
    Object.assign(instance.meta, {
      module,
      // instantiatedImports,
      exports: module.meta.exports,
    })
  }
  return adapterModuleNode
}

const linkInstanceExports = (adapterModuleNode) => {
  for (const instance of adapterModuleNode.meta.instances) {
    if (
      instance.meta.import ||
      (instance.meta.module && instance.meta.module.meta.import) ||
      instance.meta.moduleIdx !== undefined
    ) {
      continue
    }
    for (const exp of instance.meta.exports) {
      const { kind, kindIdx } = exp.meta
      const collection = kindCollection[kind]
      if (instance.meta.module) {
        const exported = instance.meta.module.meta[collection][kindIdx]
        exp.meta.exported = exported
      } else {
        const exported = adapterModuleNode.meta[collection][kindIdx]
        exp.meta.exported = exported
      }
    }
  }
  return adapterModuleNode
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

const adapterModule = pipe(
  indexModules,
  indexFuncs,
  indexInstances,
  indexImports,
  linkInstanceInstantiate,
  linkInstanceExports,
  indexAliases,
  linkAliases,
  indexExports,
  linkExports,
  (node, index, parent) => {
    for (const module of node.meta.modules) {
      if (module.meta.type === 'adapter' && !module.meta.import) {
        adapterModule(module, index, parent)
      }
    }
    return node
  }
)

export default adapterModule
