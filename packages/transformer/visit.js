export default (pluginByTag) => {
  return (node) => {
    node.forEach((child) => {
      if (child instanceof Array) {
        const [tag] = child
        const plugin = pluginByTag[tag]
        if (!plugin) {
          return
        }
        plugin(child)
      }
    })
  }
}
