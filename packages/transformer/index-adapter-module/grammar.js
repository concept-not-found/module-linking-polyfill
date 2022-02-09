import {
  sexp,
  value,
  string,
  seq,
  maybe,
  one,
  some,
  any,
  reference,
} from '../parser/grammar.js'

import { module } from '../index-module/grammar.js'

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
  value('global'),
  value('module'),
  value('instance')
)
const kindName = [kind, maybe(name)]
const kindDefinition = sexp(...kindName)
kindDefinition.builder = ([type, name]) => {
  return {
    type: type.build(),
    name: name.build(),
  }
}

const kindTypeReference = reference()
const exportType = sexp(value('export'), anyString, kindTypeReference)
exportType.builder = ([, name, kindType]) => {
  return {
    name: name.build(),
    kindType: kindType.build(),
  }
}

const instanceType = sexp(
  value('instance'),
  maybe(name),
  maybe(some(exportType))
)
instanceType.builder = ([, name, exports]) => {
  return {
    type: 'instance',
    name: name.build(),
    instanceExpression: {
      type: 'tupling',
      exports: exports.build() ?? [],
    },
  }
}

const importType = sexp(value('import'), anyString, kindTypeReference)
const moduleType = sexp(
  value('module'),
  maybe(name),
  maybe(some(importType)),
  maybe(some(exportType))
)
moduleType.builder = ([, name, imports, exports]) => {
  return {
    type: 'module',
    name: name.build(),
    imports: imports.build() ?? [],
    exports: exports.build() ?? [],
  }
}

const coreKind = one(
  value('func'),
  value('memory'),
  value('table'),
  value('global')
)
const coreKindName = [coreKind, maybe(name)]
const coreKindType = sexp(...coreKindName, any())
coreKindType.builder = ([type, name]) => {
  return {
    type: type.build(),
    name: name.build(),
  }
}

const kindType = one(coreKindType, instanceType, moduleType)
kindTypeReference.value = kindType

const importName = [value('import'), anyString]
const importFirstForm = sexp(...importName, kindType)
importFirstForm.builder = ([, name, kindType]) => {
  return {
    ...kindType.build(),
    import: {
      name: name.build(),
    },
  }
}

const inlineImport = sexp(...importName)
inlineImport.builder = ([, name]) => {
  return {
    name: name.build(),
  }
}

const coreKindTypeInlineImport = sexp(
  coreKind,
  maybe(name),
  inlineImport,
  any()
)
coreKindTypeInlineImport.builder = ([type, name, imp]) => {
  return {
    type: type.build(),
    name: name.build(),
    import: imp.build(),
  }
}

const instanceTypeInlineImport = sexp(
  value('instance'),
  maybe(name),
  inlineImport,
  maybe(some(exportType))
)
instanceTypeInlineImport.builder = ([, name, imp, exports]) => {
  return {
    type: 'instance',
    name: name.build(),
    import: imp.build(),
    instanceExpression: {
      type: 'tupling',
      exports: exports.build() ?? [],
    },
  }
}

const moduleTypeInlineImport = sexp(
  value('module'),
  maybe(name),
  inlineImport,
  maybe(some(importType)),
  maybe(some(exportType))
)
moduleTypeInlineImport.builder = ([, name, imp, imports, exports]) => {
  return {
    type: 'module',
    name: name.build(),
    import: imp.build(),
    imports: imports.build() ?? [],
    exports: exports.build() ?? [],
  }
}

const inlineImportForm = one(
  coreKindTypeInlineImport,
  instanceTypeInlineImport,
  moduleTypeInlineImport
)
const importDefinition = one(importFirstForm, inlineImportForm)

const kindReference = sexp(kind, variable)
kindReference.builder = ([kind, kindIdx]) => {
  return {
    kind: kind.build(),
    kindIdx: parseIndex(kindIdx.build()),
  }
}

const instantiateImport = sexp(...importName, kindReference)
instantiateImport.builder = ([, name, kindReference]) => {
  return {
    name: name.build(),
    kindReference: kindReference.build(),
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

const instanceInstantiate = sexp(
  value('instantiate'),
  variable,
  maybe(some(instantiateImport))
)
instanceInstantiate.builder = ([, moduleIdx, imports]) => {
  return {
    type: 'instantiate',
    moduleIdx: parseIndex(moduleIdx.build()),
    imports: imports.build() ?? [],
  }
}

const instanceExport = sexp(...exportName, kindReference)
instanceExport.builder = ([, name, kindReference]) => {
  return {
    name: name.build(),
    kindReference: kindReference.build(),
  }
}

const instanceTupling = maybe(some(instanceExport))
instanceTupling.builder = ([exports]) => {
  return {
    type: 'tupling',
    exports: exports?.build() ?? [],
  }
}

const instanceExpression = one(instanceInstantiate, instanceTupling)
const instanceDefinition = sexp(
  value('instance'),
  maybe(name),
  instanceExpression
)
instanceDefinition.builder = ([, name, instanceExpression]) => {
  return {
    type: 'instance',
    name: name.build(),
    instanceExpression: instanceExpression.build(),
  }
}

const instanceExportAlias = seq(variable, anyString)
instanceExportAlias.builder = ([instanceIdx, name]) => {
  return {
    type: 'instance export',
    instanceIdx: parseIndex(instanceIdx.build()),
    name: name.build(),
  }
}

const outerAlias = seq(variable, variable)
outerAlias.builder = ([outerIdx, kindIdx]) => {
  return {
    type: 'outer',
    outerIdx: parseIndex(outerIdx.build()),
    kindIdx: parseIndex(kindIdx.build()),
  }
}

const aliasTarget = one(instanceExportAlias, outerAlias)
const aliasFirstForm = sexp(value('alias'), aliasTarget, kindDefinition)
aliasFirstForm.builder = ([, aliasTarget, kindDefinition]) => {
  return {
    ...kindDefinition.build(),
    alias: aliasTarget.build(),
  }
}
const inlineAliasForm = sexp(...kindName, sexp(value('alias'), aliasTarget))
inlineAliasForm.builder = ([type, name, alias]) => {
  const [, aliasTarget] = alias.build()
  return {
    type: type.build(),
    name: name.build(),
    alias: aliasTarget,
  }
}
const aliasDefinition = one(aliasFirstForm, inlineAliasForm)

const adapterModuleReference = reference()
const definition = one(
  importDefinition,
  instanceDefinition,
  aliasDefinition,
  exportDefinition,
  module,
  adapterModuleReference,
  sexp(any())
)
const adapterModule = sexp(
  value('adapter'),
  value('module'),
  maybe(name),
  maybe(some(definition)),
  any()
)
adapterModule.builder = ([, , name, definitions]) => {
  return {
    type: 'adapter module',
    name: name.build(),
    definitions: definitions.build() ?? [],
  }
}
adapterModuleReference.value = adapterModule

export default (wat) => adapterModule(wat).build()
