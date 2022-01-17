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
    for (const imp of node?.meta?.imports ?? []) {
      imports[imp.meta.module] = {
        kind: imp.meta.kind,
        exports: Object.fromEntries(
          imp.meta.exports.map((exp) => [
            exp.meta.name,
            { kind: exp.meta.kind },
          ])
        ),
      }
    }
    const topInstances = node?.meta?.instances ?? []
    for (let index = 0; index < topInstances.length; index++) {
      const instance = topInstances[index]
      if (instance.meta.moduleIdx) {
        instances.push({
          index,
          type: 'module',
          path: [
            'modules',
            modules.findIndex(({ index }) => index === instance.meta.moduleIdx),
          ],
        })
      } else {
        instances.push({
          index,
          type: 'instance',
          exports: Object.fromEntries(
            instance.meta.exports.map((exp) => [
              exp.meta.name,
              { kind: exp.meta.kind },
            ])
          ),
        })
      }
    }
    for (const exp of node?.meta?.exports ?? []) {
      switch (exp.meta.kind) {
        case 'module':
          exports[exp.meta.name] = {
            kind: exp.meta.kind,
            path: [
              'modules',
              modules.findIndex(({ index }) => index === exp.meta.kindIdx),
            ],
          }
          break
        case 'instance':
          exports[exp.meta.name] = {
            kind: exp.meta.kind,
            path: [
              'instances',
              instances.findIndex(({ index }) => index === exp.meta.kindIdx),
            ],
          }
          break
        case 'func':
          switch (exp.meta.exported.meta.type) {
            case 'instance-export':
              exports[exp.meta.name] = {
                kind: exp.meta.exported.meta.kind,
                path: [
                  'instances',
                  instances.findIndex(
                    ({ index }) => index === exp.meta.exported.meta.instanceIdx
                  ),
                  'exports',
                  exp.meta.exported.meta.name,
                ],
              }
              break
          }
          break
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
