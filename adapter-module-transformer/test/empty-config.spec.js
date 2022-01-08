import transformer from '../index.js'

describe('adapter-module-transformer', () => {
  describe('empty config', () => {
    test('no module', () => {
      const adapterModule = `(adapter module (;0;))`
      const { modules, imports, instances, exports } =
        transformer(adapterModule)
      expect(modules).toEqual([])
      expect(imports).toEqual({})
      expect(instances).toEqual([])
      expect(exports).toEqual({})
    })

    test('no definitions', () => {
      const adapterModule = `(adapter module (;0;)
        (module (;1;))
      )`
      const { modules, imports, instances, exports } =
        transformer(adapterModule)
      expect(modules).toEqual([
        {
          index: 1,
          source: '(module (;1;))',
        },
      ])
      expect(imports).toEqual({})
      expect(instances).toEqual([])
      expect(exports).toEqual({})
    })
  })
})
