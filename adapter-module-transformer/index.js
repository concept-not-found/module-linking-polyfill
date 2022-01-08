import watParser from '../parser/index.js'
import stripWasmComments from '../core/strip-wasm-comments.js'
import stripWasmWhitespace from '../core/strip-wasm-whitespace.js'
import coreModule from '../core/module.js'
import coreAdapterModule from '../core/adapter-module.js'
import pipe from '../pipe.js'
import SexpToWasm from '../map-sexp-by-tag.js'

export default pipe(
  watParser({ sourceTags: ['module'] }),
  stripWasmComments,
  stripWasmWhitespace,
  SexpToWasm({
    module(node, index, parent) {
      if (parent?.[0] === 'import') {
        return node
      }
      node.meta.type = 'core'
      return coreModule(node, index, parent)
    },
    adapter(node, index, parent) {
      node.meta.type = 'adapter'
      return coreAdapterModule(node, index, parent)
    },
  }),
  ([node]) => {
    const modules = []
    const imports = {}
    const instances = []
    const exports = {}

    function resolvePath(node) {
      const path = []
      function walk(node) {
        if (node.meta.alias) {
          switch (node.meta.type) {
            case 'instance-export':
              path.push(
                'instances',
                instances.findIndex(
                  ({ index }) => index === node.meta.instanceIdx
                ),
                'exports',
                node.meta.name
              )
              break
            default:
              throw new Error(`missing alias type ${node.meta.type}`)
          }
          return walk(node.meta.aliased)
        }
        if (node.meta.import) {
          path.push('imports', node.meta.moduleName)
          return walk(node.meta.imported)
        }
        if (node.meta.module) {
          if (node.meta.module.meta.import) {
            return walk(node.meta.module)
          }
          path.push(
            'modules',
            modules.findIndex(({ index }) => index === node.meta.moduleIdx)
          )
          return
        }
        if (node.meta.exported) {
          if (!node.meta.exported.meta.import) {
            if (node.meta.kind === 'module') {
              path.push(
                'modules',
                modules.findIndex(({ index }) => index === node.meta.kindIdx)
              )
              return
            } else if (node.meta.kind === 'instance') {
              path.push(
                'instances',
                instances.findIndex(({ index }) => index === node.meta.kindIdx)
              )
              return
            }
          }
          return walk(node.meta.exported)
        }
      }
      walk(node)
      return path
    }

    const topModules = node?.meta?.modules ?? []
    for (let index = 0; index < topModules.length; index++) {
      const {
        meta: { type, source },
      } = topModules[index]
      if (type !== 'core') {
        continue
      }
      modules.push({
        index,
        source,
      })
    }
    for (const {
      meta: { moduleName, kind, kindType, exports },
    } of node?.meta?.imports ?? []) {
      switch (kind) {
        case 'func':
          imports[moduleName] = {
            kind: kind,
            kindType: kindType,
          }
          break
        case 'module':
        case 'instance':
          imports[moduleName] = {
            kind: kind,
            exports: Object.fromEntries(
              exports.map(({ meta: { name, kind } }) => [name, { kind }])
            ),
          }
          break
      }
    }
    const topInstances = node?.meta?.instances ?? []
    for (let index = 0; index < topInstances.length; index++) {
      const instance = topInstances[index]
      const {
        meta: { moduleIdx, exports },
      } = instance
      if (moduleIdx) {
        instances.push({
          index,
          type: 'module',
          path: resolvePath(instance),
        })
      } else {
        instances.push({
          index,
          type: 'instance',
          path: resolvePath(instance),
          exports: Object.fromEntries(
            exports.map(({ meta: { name, kind } }) => [name, { kind }])
          ),
        })
      }
    }
    for (const exp of node?.meta?.exports ?? []) {
      const {
        meta: { name, kind },
      } = exp
      exports[name] = {
        kind: kind,
        path: resolvePath(exp),
      }
    }
    return {
      modules,
      imports,
      instances,
      exports,
    }
  }
)
