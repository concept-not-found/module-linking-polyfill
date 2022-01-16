export const coreKindCollection = {
  func: 'funcs',
  table: 'tables',
  memory: 'memories',
  global: 'globals',
}

export default {
  instance: 'instances',
  module: 'modules',
  ...coreKindCollection,
}
