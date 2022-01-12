import watParser from '../parser/index.js'
import stripWasmComments from '../core/strip-wasm-comments.js'
import stripWasmWhitespace from '../core/strip-wasm-whitespace.js'
import coreAdapterModule from '../core/adapter-module.js'
import pipe from '../pipe.js'

export default pipe(
  watParser({ sourceTags: ['module'] }),
  stripWasmComments,
  stripWasmWhitespace,
  ([node]) => {
    const [adapterValue, moduleValue] = node
    if (adapterValue !== 'adapter' || moduleValue !== 'module') {
      throw new Error(
        `expected top level sexp to be adapter module but got ${JSON.stringify(
          node
        )}`
      )
    }
    node = coreAdapterModule(node)

    const modules = []
    const imports = {}
    const instances = []
    const exports = {}

    function resolvePath(node) {
      const path = []
      function walk(node) {
        if (node.kind === 'module') {
          path.push(
            'modules',
            modules.findIndex(({ index }) => index === node.kindIdx)
          )
          return
        } else if (node.kind === 'instance') {
          path.push(
            'instances',
            instances.findIndex(({ index }) => index === node.kindIdx)
          )
          return
        }
        if (node.meta.alias) {
          if (node.meta.type === 'instance-export') {
            path.push(
              'instances',
              instances.findIndex(
                ({ index }) => index === node.meta.instanceIdx
              ),
              'exports',
              node.meta.name
            )
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
        meta: { moduleIdx, imports, exports },
      } = instance
      if (moduleIdx !== undefined) {
        instances.push({
          index,
          type: 'module',
          path: resolvePath(instance),
          imports: Object.fromEntries(
            imports.map((imp) => {
              const { name, kind } = imp
              return [name, { kind, path: resolvePath(imp) }]
            })
          ),
        })
      } else {
        if (instance.meta.import) {
          instances.push({
            index,
            type: 'instance',
            exports: Object.fromEntries(
              exports.map((exp) => {
                const {
                  meta: { name, kind },
                } = exp
                return [name, { kind }]
              })
            ),
          })
        } else {
          instances.push({
            index,
            type: 'instance',
            exports: Object.fromEntries(
              exports.map((exp) => {
                const {
                  meta: { name, kind },
                } = exp
                return [name, { kind, path: resolvePath(exp) }]
              })
            ),
          })
        }
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
