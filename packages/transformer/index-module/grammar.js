import {
  sexp,
  value,
  string,
  maybe,
  one,
  some,
  any,
} from '../parser/grammar.js'

function parseIndex(index) {
  if (index.startsWith('$')) {
    return index
  }
  return Number.parseInt(index, 10)
}

const variable = value(() => true)
const name = value(() => true)
const anyString = string(() => true)

const kind = one(
  value('func'),
  value('memory'),
  value('table'),
  value('global')
)
const kindName = [kind, maybe(name)]
const kindDefinition = sexp(...kindName)
kindDefinition.builder = ([kind, name]) => {
  return {
    type: kind.build(),
    name: name.build(),
  }
}

const importName = [value('import'), anyString, anyString]
const importDefinition = sexp(...importName, kindDefinition)
importDefinition.builder = ([, moduleName, importName, kindDefinition]) => {
  const { type, name } = kindDefinition.build()
  return {
    type,
    name,
    import: {
      moduleName: moduleName.build(),
      name: importName.build(),
    },
  }
}

const kindReference = sexp(kind, variable)
kindReference.builder = ([kind, kindIdx]) => {
  return {
    kind: kind.build(),
    kindIdx: parseIndex(kindIdx.build()),
  }
}

const exportName = [value('export'), anyString]
const exportDefinition = sexp(...exportName, kindReference)
exportDefinition.builder = ([, name, kindReference]) => {
  return {
    type: 'export',
    name: name.build(),
    kindReference: kindReference.build(),
  }
}

const definition = one(
  importDefinition,
  kindDefinition,
  exportDefinition,
  any()
)
export const module = sexp(
  value('module'),
  maybe(name),
  maybe(some(definition))
)
module.builder = ([, name, definitions], { meta: { source } }) => ({
  type: 'module',
  name: name.build(),
  definitions: definitions.build() ?? [],
  source,
})

export default (wat) => module(wat).build()
