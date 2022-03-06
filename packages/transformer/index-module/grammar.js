import { match, maybe, some, any, oneOf, when } from 'patcom'

import { sexp, value, string } from '../parser/grammar.js'

function parseIndex(index) {
  if (index.startsWith('$')) {
    return index
  }
  return Number.parseInt(index, 10)
}

const variable = value()
export const name = value()
const anyString = string()

export const kind = oneOf(
  value('func'),
  value('memory'),
  value('table'),
  value('global')
)
const kindName = [kind, maybe(name)]
export const kindDefinition = when(sexp(...kindName), ([kind, name]) => {
  return {
    type: kind,
    name,
  }
})

const importName = [value('import'), anyString, anyString]
const importDefinition = when(
  sexp(...importName, kindDefinition),
  ([, moduleName, importName, kindDefinition]) => {
    const { type, name } = kindDefinition
    return {
      type,
      name,
      import: {
        moduleName,
        name: importName,
      },
    }
  }
)

const kindReference = when(sexp(kind, variable), ([kind, kindIdx]) => {
  return {
    kind,
    kindIdx: parseIndex(kindIdx),
  }
})

const exportName = [value('export'), anyString]
const exportDefinition = when(
  sexp(...exportName, kindReference),
  ([, name, kindReference]) => {
    return {
      type: 'export',
      name,
      kindReference,
    }
  }
)

const definition = oneOf(
  importDefinition,
  kindDefinition,
  exportDefinition,
  any
)
export const module = when(
  sexp(value('module'), maybe(name), maybe(some(definition))),
  (
    [, name, definitions],
    {
      result: {
        rest: {
          value: { source },
        },
      },
    }
  ) => {
    return {
      type: 'module',
      name,
      definitions: definitions ?? [],
      source,
    }
  }
)

export default (wat) => match(wat)(module)
