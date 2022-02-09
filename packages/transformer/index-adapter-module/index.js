import indexModule from '../index-module/index.js'
import kindCollection from '../kind-collection.js'

// declared empty to avoid no-use-before-define
// eslint-disable-next-line prefer-const
let adapterModule

function resolveIndex(adapterModuleNode, kind, kindIdx) {
  const collection = kindCollection[kind]
  return typeof kindIdx === 'number'
    ? kindIdx
    : adapterModuleNode.symbolIndex[collection][kindIdx]
}

function resolveOuterIndex(ancestors, outerIdx) {
  if (typeof outerIdx === 'number') {
    return outerIdx
  }

  for (const [index, { name }] of [...ancestors].reverse().entries()) {
    if (outerIdx === name) {
      return index
    }
  }
  throw new Error(
    `failed to resolved outer index ${outerIdx} to an adapter module`
  )
}

function resolve(adapterModuleNode, kind, kindIdx) {
  const collection = kindCollection[kind]
  const index = resolveIndex(adapterModuleNode, kind, kindIdx)
  return adapterModuleNode[collection][index]
}

function directPath(adapterModuleNode, kind, kindIdx) {
  const collection = kindCollection[kind]
  return [collection, resolveIndex(adapterModuleNode, kind, kindIdx)]
}

function resolvePath(adapterModuleNode, kind, kindIdx, ancestors) {
  const { import: imp, alias, path } = resolve(adapterModuleNode, kind, kindIdx)
  if (!imp && !alias) {
    return directPath(adapterModuleNode, kind, kindIdx)
  }
  return path(ancestors)
}

const indexAliases = (adapterModuleNode) => {
  for (const node of adapterModuleNode.aliases) {
    const { alias } = node
    switch (alias.type) {
      case 'instance export':
        Object.defineProperty(node, 'path', {
          value() {
            const kind = 'instance'
            const { instanceIdx, name } = alias
            return [
              ...directPath(adapterModuleNode, kind, instanceIdx),
              'exports',
              name,
            ]
          },
        })
        break
      case 'outer':
        Object.defineProperty(node, 'path', {
          value(ancestors) {
            const { type: kind } = node
            let { outerIdx } = alias
            outerIdx = resolveOuterIndex(ancestors, outerIdx)
            const { kindIdx } = alias
            const outerModuleIdx = ancestors.length - 1 - outerIdx
            const outerModule = ancestors[outerModuleIdx]
            const aliased = resolve(outerModule, kind, kindIdx)
            return [
              ...Array.from({ length: outerIdx }).fill('..'),
              ...aliased.path(ancestors.slice(0, -outerIdx)),
            ]
          },
        })
        break
    }
  }
  delete adapterModuleNode.aliases
}

const indexModules = (adapterModuleNode) => {
  const concreteModules = adapterModuleNode.modules.filter(
    ({ import: imp, alias }) => !imp && !alias
  )
  for (const [moduleIdx, node] of concreteModules.entries()) {
    Object.defineProperty(node, 'path', {
      value() {
        return ['modules', moduleIdx]
      },
    })
  }
  for (const node of concreteModules) {
    switch (node.type) {
      case 'adapter module':
        adapterModule(node)
        break
      case 'module':
        indexModule(node)
        break
    }
  }
}

const indexDefinitions = (adapterModuleNode) => {
  const matchers = [
    ...Object.entries({ ...kindCollection, export: 'exports' }).map(
      ([kind, collection]) => [collection, ({ type }) => type === kind]
    ),
    ['modules', ({ type }) => ['adapter module', 'module'].includes(type)],
    ['imports', ({ import: imp }) => imp],
    ['aliases', ({ alias }) => alias],
  ]
  for (const [collection, matcher] of matchers) {
    adapterModuleNode[collection] =
      adapterModuleNode.definitions.filter(matcher)
  }
  delete adapterModuleNode.definitions
}

const indexSymbols = (adapterModuleNode) => {
  adapterModuleNode.symbolIndex = {}
  for (const collection of Object.values(kindCollection)) {
    adapterModuleNode.symbolIndex[collection] = {}

    for (const [kindIdx, { name }] of adapterModuleNode[collection].entries()) {
      if (typeof name === 'string') {
        adapterModuleNode.symbolIndex[collection][name] = kindIdx
      }
    }
  }
}

const indexExports = (adapterModuleNode) => {
  for (const { kindReference } of adapterModuleNode.exports) {
    Object.defineProperty(kindReference, 'path', {
      value(ancestors) {
        const { kind, kindIdx } = kindReference
        return resolvePath(adapterModuleNode, kind, kindIdx, ancestors)
      },
    })
  }
}

const indexInstances = (adapterModuleNode) => {
  const concreteInstances = adapterModuleNode.instances.filter(
    ({ import: imp, alias }) => !imp && !alias
  )
  for (const [instanceIdx, instance] of concreteInstances.entries()) {
    Object.defineProperty(instance, 'path', {
      value() {
        return ['instances', instanceIdx]
      },
    })
  }
  for (const { instanceExpression } of concreteInstances) {
    switch (instanceExpression.type) {
      case 'instantiate':
        Object.defineProperty(instanceExpression, 'modulePath', {
          value(ancestors) {
            const kind = 'module'
            return resolvePath(
              adapterModuleNode,
              kind,
              instanceExpression.moduleIdx,
              ancestors
            )
          },
        })
        for (const { kindReference } of instanceExpression.imports) {
          Object.defineProperty(kindReference, 'path', {
            value(ancestors) {
              const { kind, kindIdx } = kindReference
              const imported = resolve(adapterModuleNode, kind, kindIdx)
              return imported.path(ancestors)
            },
          })
        }
        break
      case 'tupling':
        for (const { kindReference } of instanceExpression.exports) {
          Object.defineProperty(kindReference, 'path', {
            value(ancestors) {
              const { kind, kindIdx } = kindReference
              const exported = resolve(adapterModuleNode, kind, kindIdx)
              return exported.path(ancestors)
            },
          })
        }
        break
    }
  }
}

const indexImports = (adapterModuleNode) => {
  for (const imp of adapterModuleNode.imports) {
    Object.defineProperty(imp, 'path', {
      value() {
        const {
          import: { name },
        } = imp
        return ['imports', name]
      },
    })
  }
}

adapterModule = (node) => {
  indexDefinitions(node)
  indexModules(node)
  indexInstances(node)
  indexSymbols(node)
  indexImports(node)
  indexAliases(node)
  indexExports(node)
}

export default adapterModule
