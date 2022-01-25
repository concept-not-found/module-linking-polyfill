export default (pluginByTag) => {
  return (node) => {
    for (const child of node) {
      if (Array.isArray(child)) {
        const [tag] = child
        const plugin = pluginByTag[tag]
        if (!plugin) {
          continue
        }
        plugin(child)
      }
    }
  }
}
