export default (wabt, transformer, runtime) => {
  return {
    transformWat(wat) {
      const config = transformer(wat)
      for (const [index, module] of config.modules.entries()) {
        if (module.source) {
          const { buffer, log } = wabt
            .parseWat(`module ${index}.wat`, module.source)
            .toBinary({ log: true })
          module.binary = buffer
          module.log = log
        }
      }
      return config
    },

    execJs(js, config) {
      const lines = []
      const fakeConsole = {
        log(...messages) {
          lines.push(`${messages.join(' ')}\n`)
        },
      }

      const executable = new Function(
        'console',
        'moduleLinkingPolyfillRuntime',
        'config',
        js
      )
      executable(fakeConsole, runtime, config)
      return lines.join('')
    },
  }
}
