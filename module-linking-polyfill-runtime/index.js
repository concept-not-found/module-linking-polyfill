function path(parts, object) {
  try {
    for (let i = 0; i < parts.length; i++) {
      object = object[parts[i]]
    }
    return object
  } catch (error) {
    throw new Error(
      `failed to walk path [${parts.join(', ')}] in ${JSON.stringify(object)}`
    )
  }
}
export default (config, imports) => {
  const live = {
    modules: config.modules,
    imports: Object.fromEntries(
      Object.entries(config.imports).map(([moduleName, imp]) => {
        if (imp.kind === 'instance') {
          return [moduleName, { exports: imports[moduleName] }]
        }
        return [moduleName, imports[moduleName]]
      })
    ),
    instances: [],
  }

  config.instances.forEach((instance) => {
    if (instance.kind === 'module') {
      const module = path(instance.path, live)
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
        new WebAssembly.Instance(new WebAssembly.Module(module.binary), imports)
      )
    } else if (instance.path) {
      live.instances.push(path(instance.path, live))
    } else {
      live.instances.push(instance)
    }
  })

  const exports = {}
  for (const name in config.exports) {
    const exp = config.exports[name]
    exports[name] = path(exp.path, live)
  }
  return exports
}
