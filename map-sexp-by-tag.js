import postorderMap from './postorder-map.js'
import mergePlugins from './merge-plugins.js'

export default (...plugins) => {
  const pluginByTag = mergePlugins(plugins)

  return postorderMap((node, index, parent) => {
    if (node instanceof Array) {
      const [tag] = node
      const plugin = pluginByTag[tag]
      if (!plugin) {
        return node
      }
      const result = plugin(node, index, parent)
      result.meta = node.meta
      return result
    } else {
      return node
    }
  })
}
