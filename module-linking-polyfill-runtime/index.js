function path(parts, object) {
  for (let i = 0; i < parts.length; i++) {
    object = object[parts[i]]
  }
  return object
}
export default (config, imports) => {
  const live = {
    modules: config.modules,
  }

  live.instances = config.instances.map((instance) => {
    if (instance.type === 'module') {
      const module = path(instance.path, live)
      return new WebAssembly.Instance(new WebAssembly.Module(module.binary))
    }
    return instance
  })

  const exports = {}
  for (const name in config.exports) {
    const exp = config.exports[name]
    exports[name] = path(exp.path, live)
  }
  return exports
}
