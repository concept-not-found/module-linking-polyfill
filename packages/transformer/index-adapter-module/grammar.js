import { match, group, maybe, some, rest, oneOf, when } from 'patcom'

import { reference } from '../parser/index.js'
import { sexp, value, string } from '../parser/grammar.js'

import { module } from '../index-module/grammar.js'

function parseIndex(index) {
  if (index.startsWith('$')) {
    return index
  }
  return Number.parseInt(index, 10)
}

const variable = value()
const name = value()
const anyString = string()

const kind = oneOf(
  value('func'),
  value('memory'),
  value('table'),
  value('global'),
  value('module'),
  value('instance')
)
const kindName = [kind, maybe(name)]
const kindDefinition = when(sexp(...kindName), ([type, name]) => {
  return {
    type,
    name,
  }
})

const kindTypeReference = reference()
const exportType = when(
  sexp(value('export'), anyString, kindTypeReference),
  ([, name, kindType]) => {
    return {
      name,
      kindType,
    }
  }
)

const instanceType = when(
  sexp(value('instance'), maybe(name), maybe(some(exportType))),
  ([, name, exports]) => {
    return {
      type: 'instance',
      name,
      instanceExpression: {
        type: 'tupling',
        exports: exports ?? [],
      },
    }
  }
)

const importType = sexp(value('import'), anyString, kindTypeReference)
const moduleType = when(
  sexp(
    value('module'),
    maybe(name),
    maybe(some(importType)),
    maybe(some(exportType))
  ),
  ([, name, imports, exports]) => {
    return {
      type: 'module',
      name,
      imports: imports ?? [],
      exports: exports ?? [],
    }
  }
)

const coreKind = oneOf(
  value('func'),
  value('memory'),
  value('table'),
  value('global')
)
const coreKindName = [coreKind, maybe(name)]
const coreKindType = when(sexp(...coreKindName, rest), ([type, name]) => {
  return {
    type,
    name,
  }
})

const kindType = oneOf(coreKindType, instanceType, moduleType)
kindTypeReference.matcher = kindType

const importName = [value('import'), anyString]
const importFirstForm = when(
  sexp(...importName, kindType),
  ([, name, kindType]) => {
    return {
      ...kindType,
      import: {
        name,
      },
    }
  }
)

const inlineImport = when(sexp(...importName), ([, name]) => {
  return {
    name,
  }
})

const coreKindTypeInlineImport = when(
  sexp(coreKind, maybe(name), inlineImport, rest),
  ([type, name, imp]) => {
    return {
      type,
      name,
      import: imp,
    }
  }
)

const instanceTypeInlineImport = when(
  sexp(value('instance'), maybe(name), inlineImport, maybe(some(exportType))),
  ([, name, imp, exports]) => {
    return {
      type: 'instance',
      name,
      import: imp,
      instanceExpression: {
        type: 'tupling',
        exports: exports ?? [],
      },
    }
  }
)

const moduleTypeInlineImport = when(
  sexp(
    value('module'),
    maybe(name),
    inlineImport,
    maybe(some(importType)),
    maybe(some(exportType))
  ),
  ([, name, imp, imports, exports]) => {
    return {
      type: 'module',
      name,
      import: imp,
      imports: imports ?? [],
      exports: exports ?? [],
    }
  }
)

const inlineImportForm = oneOf(
  coreKindTypeInlineImport,
  instanceTypeInlineImport,
  moduleTypeInlineImport
)
const importDefinition = oneOf(importFirstForm, inlineImportForm)

const kindReference = when(sexp(kind, variable), ([kind, kindIdx]) => {
  return {
    kind,
    kindIdx: parseIndex(kindIdx),
  }
})

const instantiateImport = when(
  sexp(...importName, kindReference),
  ([, name, kindReference]) => {
    return {
      name,
      kindReference,
    }
  }
)

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

const instanceInstantiate = when(
  sexp(value('instantiate'), variable, maybe(some(instantiateImport))),
  ([, moduleIdx, imports]) => {
    return {
      type: 'instantiate',
      moduleIdx: parseIndex(moduleIdx),
      imports: imports ?? [],
    }
  }
)

const instanceExport = when(
  sexp(...exportName, kindReference),
  ([, name, kindReference]) => {
    return {
      name,
      kindReference,
    }
  }
)

const instanceTupling = when(maybe(some(instanceExport)), (exports) => {
  return {
    type: 'tupling',
    exports: exports ?? [],
  }
})

const instanceExpression = oneOf(instanceInstantiate, instanceTupling)
const instanceDefinition = when(
  sexp(value('instance'), maybe(name), instanceExpression),
  ([, name, instanceExpression]) => {
    return {
      type: 'instance',
      name,
      instanceExpression,
    }
  }
)

const instanceExportAlias = when(
  group(variable, anyString),
  ([instanceIdx, name]) => {
    return {
      type: 'instance export',
      instanceIdx: parseIndex(instanceIdx),
      name,
    }
  }
)

const outerAlias = when(group(variable, variable), ([outerIdx, kindIdx]) => {
  return {
    type: 'outer',
    outerIdx: parseIndex(outerIdx),
    kindIdx: parseIndex(kindIdx),
  }
})

const aliasTarget = oneOf(instanceExportAlias, outerAlias)
const aliasFirstForm = when(
  sexp(value('alias'), aliasTarget, kindDefinition),
  ([, aliasTarget, kindDefinition]) => {
    return {
      ...kindDefinition,
      alias: aliasTarget,
    }
  }
)
const inlineAliasForm = when(
  sexp(...kindName, sexp(value('alias'), aliasTarget)),
  ([type, name, [, aliasTarget]]) => {
    return {
      type,
      name,
      alias: aliasTarget,
    }
  }
)
const aliasDefinition = oneOf(aliasFirstForm, inlineAliasForm)

const adapterModuleReference = reference()
const definition = oneOf(
  importDefinition,
  instanceDefinition,
  aliasDefinition,
  exportDefinition,
  module,
  adapterModuleReference,
  sexp(rest)
)
const adapterModule = when(
  sexp(
    value('adapter'),
    value('module'),
    maybe(name),
    maybe(some(definition)),
    rest
  ),
  ([, , name, definitions]) => {
    return {
      type: 'adapter module',
      name,
      definitions: definitions ?? [],
    }
  }
)
adapterModuleReference.matcher = adapterModule

export default (wat) => match(wat)(adapterModule)
