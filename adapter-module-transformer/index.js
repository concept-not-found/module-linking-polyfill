import watParser from '../parser/index.js'
import stripWasmComments from '../core/strip-wasm-comments.js'
import stripWasmWhitespace from '../core/strip-wasm-whitespace.js'
import coreAdapterModule from '../core/adapter-module.js'
import pipe from '../pipe.js'

const kindCollection = {
  instance: 'instances',
  func: 'funcs',
  module: 'modules',
  memory: 'memories',
}

function resolvePath({ meta }, ancestors) {
  if (meta.alias) {
    if (meta.type === 'instance-export') {
      return ['instances', meta.instanceIdx, 'exports', meta.name]
    } else {
      const outerModuleIdx = ancestors.length - 1 - meta.outerIdx
      const outerModule = ancestors[outerModuleIdx]
      const collection = kindCollection[meta.kind]
      return [
        ...Array(meta.outerIdx).fill('..'),
        ...resolvePath(outerModule.meta[collection][meta.kindIdx], ancestors),
      ]
    }
  }
  if (meta.import) {
    return ['imports', meta.moduleName]
  }
  if (meta.moduleIdx !== undefined) {
    const module = ancestors[ancestors.length - 1].meta.modules[meta.moduleIdx]
    if (module.meta.import) {
      return resolvePath(module, ancestors)
    }
    return ['modules', meta.moduleIdx]
  }
  if (meta.export) {
    const collection = kindCollection[meta.kind]
    const exported =
      ancestors[ancestors.length - 1].meta[collection][meta.kindIdx]
    if (!exported.meta.import) {
      if (meta.kind === 'module') {
        return ['modules', meta.kindIdx]
      } else if (meta.kind === 'instance') {
        return ['instances', meta.kindIdx]
      }
    }
    return resolvePath(exported, ancestors)
  }
  if (meta.kind === 'module') {
    return ['modules', meta.kindIdx]
  } else if (meta.kind === 'instance') {
    return ['instances', meta.kindIdx]
  }
}

const createAdapterModuleConfig = (node, ancestors = [node]) => {
  const [adapterValue, moduleValue] = node
  if (adapterValue !== 'adapter' || moduleValue !== 'module') {
    throw new Error(
      `expected top level sexp to be adapter module but got ${JSON.stringify(
        node
      )}`
    )
  }
  node = coreAdapterModule(node)

  const modules = node.meta.modules
    .filter((module) => module.meta.type === 'core' || !module.meta.import)
    .map((module) => {
      const {
        meta: { type, source },
      } = module
      if (type === 'core') {
        return {
          kind: 'module',
          source,
        }
      }
      return createAdapterModuleConfig(module, [...ancestors, module])
    })

  const imports = Object.fromEntries(
    node.meta.imports.map(
      ({ meta: { moduleName, kind, kindType, exports } }) => {
        switch (kind) {
          case 'func':
            return [
              moduleName,
              {
                kind,
                kindType,
              },
            ]
          case 'module':
          case 'instance':
            return [
              moduleName,
              {
                kind,
                exports: Object.fromEntries(
                  exports.map(({ meta: { name, kind } }) => [name, { kind }])
                ),
              },
            ]
          default:
            throw new Error(`import of type ${kind} not implemented`)
        }
      }
    )
  )

  const instances = node.meta.instances.map((instance) => {
    const {
      meta: { moduleIdx, imports, exports },
    } = instance
    if (moduleIdx !== undefined) {
      return {
        kind: 'module',
        path: resolvePath(instance, ancestors),
        imports: Object.fromEntries(
          imports.map((imp) => {
            const { name, kind } = imp.meta
            return [name, { kind, path: resolvePath(imp, ancestors) }]
          })
        ),
      }
    } else if (instance.meta.import) {
      return {
        kind: 'instance',
        path: resolvePath(instance, ancestors),
        exports: Object.fromEntries(
          exports.map((exp) => {
            const {
              meta: { name, kind },
            } = exp
            return [name, { kind }]
          })
        ),
      }
    } else {
      return {
        kind: 'instance',
        exports: Object.fromEntries(
          exports.map((exp) => {
            const {
              meta: { name, kind },
            } = exp
            return [name, { kind, path: resolvePath(exp, ancestors) }]
          })
        ),
      }
    }
  })

  const exports = Object.fromEntries(
    node.meta.exports.map((exp) => {
      const {
        meta: { name, kind },
      } = exp
      return [
        name,
        {
          kind,
          path: resolvePath(exp, ancestors),
        },
      ]
    })
  )

  return {
    kind: 'adapter module',
    modules,
    imports,
    instances,
    exports,
  }
}

export default pipe(
  watParser({ sourceTags: ['module'] }),
  stripWasmComments,
  stripWasmWhitespace,
  (root) => {
    if (root.length !== 1) {
      throw new Error('expected a single adapter module')
    }
    return root[0]
  },
  createAdapterModuleConfig
)
