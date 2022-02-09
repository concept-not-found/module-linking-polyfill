# Module linking polyfill

An **incomplete** 🚧 work in progress 🚧 polyfill for [WebAssembly](https://webassembly.org/) [Module linking proposal](https://github.com/WebAssembly/module-linking).

### <a href="https://concept-not-found.github.io/module-linking-polyfill">Live demo</a>

### 💣 Not production ready 💣

Critical issues need to be resolved before the first release:

- implement [type definitions](https://github.com/WebAssembly/module-linking/blob/main/design/proposals/module-linking/Explainer.md#type-definitions)
- implement [alias syntactic sugar](https://github.com/WebAssembly/module-linking/blob/main/design/proposals/module-linking/Explainer.md#alias-definitions)
- implement type checking
- implement error handling
- add test scenarios
- decide on feature set of first release
  - is binary format support?
- stabilize both runtime and transformer API
- documentation

### Project goals

The intention of this project learn and understand how Module linking works. We value correctness and clear error messages over performance.
