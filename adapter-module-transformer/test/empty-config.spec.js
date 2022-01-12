import transformer from '../index.js'

describe('adapter-module-transformer', () => {
  describe('empty config', () => {
    test('no module', () => {
      const wat = `(adapter module (;0;))`
      const adapterModule = transformer(wat)
      expect(adapterModule).toEqual({
        kind: 'adapter module',
        modules: [],
        imports: {},
        instances: [],
        exports: {},
      })
    })

    test('no definitions', () => {
      const wat = `(adapter module (;0;)
        (module (;0;))
      )`
      const adapterModule = transformer(wat)
      expect(adapterModule).toEqual({
        kind: 'adapter module',
        modules: [
          {
            kind: 'module',
            source: '(module (;0;))',
          },
        ],
        imports: {},
        instances: [],
        exports: {},
      })
    })
  })
})
