import watParser from '../parser/index.js'
import stripWasmComments from '../core/strip-wasm-comments.js'
import stripWasmWhitespace from '../core/strip-wasm-whitespace.js'
import coreAdapterModule from '../core/adapter-module.js'
import pipe from '../pipe.js'

function resolvePath(node) {
  const path = []
  function walk(node) {
    if (node.kind === 'module') {
      path.push('modules', node.kindIdx)
      return
    } else if (node.kind === 'instance') {
      path.push('instances', node.kindIdx)
      return
    }
    if (node.meta.alias) {
      if (node.meta.type === 'instance-export') {
        path.push('instances', node.meta.instanceIdx, 'exports', node.meta.name)
        return
      } else {
        throw new Error(`missing alias type ${node.meta.type}`)
      }
    }
    if (node.meta.import) {
      path.push('imports', node.meta.moduleName)
      return walk(node.meta.imported)
    }
    if (node.meta.module) {
      if (node.meta.module.meta.import) {
        return walk(node.meta.module)
      }
      path.push('modules', node.meta.moduleIdx)
      return
    }
    if (node.meta.exported) {
      if (!node.meta.exported.meta.import) {
        if (node.meta.kind === 'module') {
          path.push('modules', node.meta.kindIdx)
          return
        } else if (node.meta.kind === 'instance') {
          path.push('instances', node.meta.kindIdx)
          return
        }
      }
      return walk(node.meta.exported)
    }
    if (node.meta.kind === 'module') {
      path.push('modules', node.meta.kindIdx)
      return
    } else if (node.meta.kind === 'instance') {
      path.push('instances', node.meta.kindIdx)
      return
    }
  }
  walk(node)
  return path
}

const createAdapterModuleConfig = (node) => {
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
      return createAdapterModuleConfig(module)
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
        path: resolvePath(instance),
        imports: Object.fromEntries(
          imports.map((imp) => {
            const { name, kind } = imp
            return [name, { kind, path: resolvePath(imp) }]
          })
        ),
      }
    } else if (instance.meta.import) {
      return {
        kind: 'instance',
        path: resolvePath(instance),
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
            return [name, { kind, path: resolvePath(exp) }]
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
          path: resolvePath(exp),
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
