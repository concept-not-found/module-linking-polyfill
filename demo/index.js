import adapterModuleTransformer from '../adapter-module-transformer/index.js'
import moduleLinkingPolyfillRuntime from '../module-linking-polyfill-runtime/index.js'

export default (wabt, fakeConsole) => {
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
      const executable = new Function(
        'console',
        'moduleLinkingPolyfillRuntime',
        'config',
        js
      )
      executable(fakeConsole, moduleLinkingPolyfillRuntime, config)
    },
  }
}
