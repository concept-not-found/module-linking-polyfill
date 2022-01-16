import transformer from './node_modules/module-linking-polyfill-transformer/index.js'
import runtime from './node_modules/module-linking-polyfill-runtime/index.js'

export default (wabt) => {
  return {
    transformWat(wat) {
      const config = transformer(wat)
      config.modules.forEach((module, index) => {
        if (module.source) {
          const { buffer, log } = wabt
            .parseWat(`module ${index}.wat`, module.source)
            .toBinary({ log: true })
          module.binary = buffer
          module.log = log
        }
      })
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
