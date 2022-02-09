import onedent from '../onedent.js'
import transformer from '../index.js'

describe('adapter-module-transformer', () => {
  describe('empty config', () => {
    test('empty adapter module', () => {
      const wat = `
        (adapter module (;0;))
      `
      const adapterModule = transformer(wat)
      expect(adapterModule).toEqual({
        kind: 'adapter module',
        modules: [],
        imports: {},
        instances: [],
        exports: {},
      })
    })

    test('nested empty module', () => {
      const wat = `
        (adapter module (;0;)
          (module (;0;))
        )
      `
      const adapterModule = transformer(wat)
      expect(adapterModule).toEqual({
        kind: 'adapter module',
        modules: [
          {
            kind: 'module',
            source: onedent`
              (module (;0;))
            `,
          },
        ],
        imports: {},
        instances: [],
        exports: {},
      })
    })
  })
})
