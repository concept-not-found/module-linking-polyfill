import pipe from './pipe.js'

export default (plugins) => {
  const pluginByTag = plugins.reduce((result, plugin) => {
    for (const tag in plugin) {
      result[tag] ??= []
      result[tag].push(plugin[tag])
    }
    return result
  }, {})
  for (const tag in pluginByTag) {
    pluginByTag[tag] = pipe(...pluginByTag[tag])
  }
  return pluginByTag
}
