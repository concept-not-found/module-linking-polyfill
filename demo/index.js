import adapterModuleTransformer from '../adapter-module-transformer/index.js'
import moduleLinkingPolyfillRuntime from '../module-linking-polyfill-runtime/index.js'

export default (wabt) => {
  return {
    transformWat(wat) {
      const config = adapterModuleTransformer(wat)
      config.modules.forEach((module, index) => {
        const { buffer, log } = wabt
          .parseWat(`module ${index}.wat`, module.source)
          .toBinary({ log: true })
        module.binary = buffer
        module.log = log
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
      executable(fakeConsole, moduleLinkingPolyfillRuntime, config)
      return lines.join('')
    },
  }
}
