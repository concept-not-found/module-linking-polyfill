import watParser from './parser/index.js'
import pipe from './pipe.js'

import indexAdapterModule from './index-adapter-module/index.js'
import parseAdapterModule from './index-adapter-module/grammar.js'

const createAdapterModuleConfig = (node, ancestors = [node]) => {
  if (node.type !== 'adapter module') {
    throw new Error(
      `expected top level sexp to be adapter module but got ${JSON.stringify(
        node
      )}`
    )
  }

  const modules = node.modules
    .filter(
      ({ type, import: imp, alias }) =>
        ['adapter module', 'module'].includes(type) && !imp && !alias
    )
    .map((module) => {
      const { type, source } = module
      if (type === 'module') {
        return {
          kind: 'module',
          source,
        }
      }
      return createAdapterModuleConfig(module, [...ancestors, module])
    })

  const imports = Object.fromEntries(
    node.imports.map(
      ({ type: kind, exports, instanceExpression, import: { name } }) => {
        switch (kind) {
          case 'func':
          case 'table':
          case 'memory':
          case 'global':
            return [
              name,
              {
                kind,
                kindType: [],
              },
            ]
          case 'module':
            return [
              name,
              {
                kind,
                exports: Object.fromEntries(
                  exports.map(({ name, kindType: { type: kind } }) => [
                    name,
                    { kind },
                  ])
                ),
              },
            ]
          case 'instance':
            return [
              name,
              {
                kind,
                exports: Object.fromEntries(
                  instanceExpression.exports.map(
                    ({ name, kindType: { type: kind } }) => [name, { kind }]
                  )
                ),
              },
            ]
          default:
            throw new Error(`import of type ${kind} not implemented`)
        }
      }
    )
  )

  const instances = node.instances.map(
    ({
      instanceExpression: { type, imports, exports, modulePath },
      import: imp,
      path,
      // eslint-disable-next-line array-callback-return
    }) => {
      switch (type) {
        case 'instantiate':
          return {
            kind: 'module',
            modulePath: modulePath(ancestors),
            imports: Object.fromEntries(
              imports.map(({ name, kindReference: { kind, path } }) => {
                return [name, { kind, path: path(ancestors) }]
              })
            ),
          }
        case 'tupling':
          return imp
            ? {
                kind: 'instance',
                path: path(ancestors),
                exports: Object.fromEntries(
                  exports.map(({ name, kindType: { type: kind } }) => {
                    return [name, { kind }]
                  })
                ),
              }
            : {
                kind: 'instance',
                exports: Object.fromEntries(
                  exports.map(({ name, kindReference: { kind, path } }) => {
                    return [name, { kind, path: path(ancestors) }]
                  })
                ),
              }
      }
    }
  )

  const exports = Object.fromEntries(
    node.exports.map(({ name, kindReference: { kind, path } }) => {
      return [
        name,
        {
          kind,
          path: path(ancestors),
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
  parseAdapterModule,
  (node) => {
    indexAdapterModule(node)
    return node
  },
  createAdapterModuleConfig
)
