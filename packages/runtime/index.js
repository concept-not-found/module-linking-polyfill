function path(parts, object) {
  const original = object
  try {
    for (let i = 0; i < parts.length; i++) {
      object = object[parts[i]]
    }
    return object
  } catch (error) {
    throw new Error(
      `failed to walk path [${parts.join(', ')}] in ${JSON.stringify(
        original,
        null,
        2
      )}`
    )
  }
}

const createAdapterModuleInstance = (config, imports = {}, parent) => {
  const live = {
    '..': parent,
    modules: config.modules,
    imports: Object.fromEntries(
      Object.entries(config.imports).map(([moduleName, imp]) => {
        return [moduleName, imports[moduleName]]
      })
    ),
    instances: [],
  }

  config.instances.forEach((instance) => {
    if (instance.kind === 'module') {
      const module = path(instance.path, live)
      if (module.kind === 'module') {
        const imports = {}
        for (const moduleName in instance.imports) {
          const imp = instance.imports[moduleName]
          if (imp.kind === 'instance') {
            const otherInstance = path(imp.path, live)
            imports[moduleName] = otherInstance.exports
          } else {
            imports[moduleName] = path(imp.path, live)
          }
        }
        live.instances.push(
          new WebAssembly.Instance(
            new WebAssembly.Module(module.binary),
            imports
          )
        )
      } else {
        const imports = {}
        for (const moduleName in instance.imports) {
          const imp = instance.imports[moduleName]
          if (imp.kind === 'instance') {
            const otherInstance = path(imp.path, live)
            imports[moduleName] = otherInstance
          } else {
            imports[moduleName] = path(imp.path, live)
          }
        }
        live.instances.push(
          createAdapterModuleInstance(path(instance.path, live), imports, live)
        )
      }
    } else {
      live.instances.push({ exports: path(instance.path, live) })
    }
  })

  const exports = {}
  for (const name in config.exports) {
    const exp = config.exports[name]
    exports[name] = path(exp.path, live)
  }
  return { exports }
}

export default createAdapterModuleInstance
