import mergePlugins from './merge-plugins.js'

export default (...plugins) => {
  const pluginByTag = mergePlugins(plugins)
  return (node) => {
    const result = node.map((child, index, parent) => {
      if (child instanceof Array) {
        const [tag] = child
        const plugin = pluginByTag[tag]
        if (!plugin) {
          return child
        }
        const result = plugin(child, index, parent)
        result.meta = child.meta
        return result
      } else {
        return child
      }
    })
    result.meta = node.meta
    return result
  }
}
