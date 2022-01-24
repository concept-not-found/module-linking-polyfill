import runtime from './index.js'

describe('module-linking-polyfill-runtime', () => {
  test('adapter module refers to parent', () => {
    const config = {
      kind: 'adapter module',
      modules: [
        {
          kind: 'adapter module',
          modules: [],
          imports: {},
          instances: [],
          exports: {
            'inner-exp': {
              kind: 'func',
              path: ['..', 'imports', 'imp'],
            },
          },
        },
      ],
      imports: {
        imp: {
          kind: 'func',
          kindType: [],
        },
      },
      instances: [
        {
          kind: 'module',
          modulePath: ['modules', 0],
        },
      ],
      exports: {
        exp: {
          kind: 'func',
          path: ['instances', 0, 'exports', 'inner-exp'],
        },
      },
    }
    const imp = () => {}
    const {
      exports: { exp },
    } = runtime(config, {
      imp,
    })
    expect(exp).toBe(imp)
  })
})
