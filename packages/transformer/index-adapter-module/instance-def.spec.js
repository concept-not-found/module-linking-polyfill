import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import indexAdapterModule from './index.js'
import parseModule from './grammar.js'

describe('index adapter module', () => {
  describe('instance definition', () => {
    describe('empty instance', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (instance)
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.instances[0]).toEqual({
          type: 'instance',
          instanceExpression: {
            type: 'tupling',
            exports: [],
          },
        })
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (instance $i)
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.instances[0]).toEqual({
          type: 'instance',
          name: '$i',
          instanceExpression: {
            type: 'tupling',
            exports: [],
          },
        })
      })
    })

    describe('instance instantiates module', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (module)
            (instance (instantiate 0))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(
          adapterModule.instances[0].instanceExpression.modulePath()
        ).toEqual(['modules', 0])
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (module $M)
            (instance (instantiate $M))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(
          adapterModule.instances[0].instanceExpression.modulePath()
        ).toEqual(['modules', 0])
      })
    })

    describe('instance imports module', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (adapter module
              (import "self" (module))
            )
            (instance (instantiate 0
              (import "self" (module 0))
            ))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.instances[0].instanceExpression.imports).toEqual([
          {
            name: 'self',
            kindReference: {
              kind: 'module',
              kindIdx: 0,
            },
          },
        ])
        expect(
          adapterModule.instances[0].instanceExpression.imports[0].kindReference.path()
        ).toEqual(['modules', 0])
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (adapter module $M
              (import "self" (module))
            )
            (instance (instantiate $M
              (import "self" (module $M))
            ))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.instances[0].instanceExpression.imports).toEqual([
          {
            name: 'self',
            kindReference: {
              kind: 'module',
              kindIdx: '$M',
            },
          },
        ])
        expect(
          adapterModule.instances[0].instanceExpression.imports[0].kindReference.path()
        ).toEqual(['modules', 0])
      })
    })

    describe('instance imports func', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (adapter module
              (import "f" (func))
            )
            (import "imp" (func))
            (instance (instantiate 0
              (import "f" (func 0))
            ))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(
          adapterModule.instances[0].instanceExpression.imports[0].kindReference.path()
        ).toEqual(['imports', 'imp'])
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (adapter module
              (import "f" (func))
            )
            (import "imp" (func $f))
            (instance (instantiate 0
              (import "f" (func $f))
            ))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(
          adapterModule.instances[0].instanceExpression.imports[0].kindReference.path()
        ).toEqual(['imports', 'imp'])
      })
    })

    describe('instance exports module', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (module)
            (instance
              (export "ex" (module 0))
            )
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(
          adapterModule.instances[0].instanceExpression.exports[0]
        ).toEqual({
          name: 'ex',
          kindReference: {
            kind: 'module',
            kindIdx: 0,
          },
        })
        expect(
          adapterModule.instances[0].instanceExpression.exports[0].kindReference.path()
        ).toEqual(['modules', 0])
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (module $M)
            (instance
              (export "ex" (module $M))
            )
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(
          adapterModule.instances[0].instanceExpression.exports[0]
        ).toEqual({
          name: 'ex',
          kindReference: {
            kind: 'module',
            kindIdx: '$M',
          },
        })
        expect(
          adapterModule.instances[0].instanceExpression.exports[0].kindReference.path()
        ).toEqual(['modules', 0])
      })
    })

    describe('instance exports func', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (import "imp" (func))
            (instance
              (export "f" (func 0))
            )
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(
          adapterModule.instances[0].instanceExpression.exports[0].kindReference.path()
        ).toEqual(['imports', 'imp'])
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (import "imp" (func $f))
            (instance
              (export "f" (func $f))
            )
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(
          adapterModule.instances[0].instanceExpression.exports[0].kindReference.path()
        ).toEqual(['imports', 'imp'])
      })
    })

    describe('import instance', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (import "imp" (instance
              (export "f" (func))
            ))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.instances[0]).toEqual({
          type: 'instance',
          instanceExpression: {
            type: 'tupling',
            exports: [
              {
                name: 'f',
                kindType: {
                  type: 'func',
                },
              },
            ],
          },
          import: {
            name: 'imp',
          },
        })
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (import "imp" (instance $i
              (export "f" (func))
            ))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.symbolIndex.instances.$i).toBe(0)
        expect(adapterModule.instances[0]).toEqual({
          type: 'instance',
          name: '$i',
          instanceExpression: {
            type: 'tupling',
            exports: [
              {
                name: 'f',
                kindType: {
                  type: 'func',
                },
              },
            ],
          },
          import: {
            name: 'imp',
          },
        })
      })
    })

    describe('alias instance', () => {
      test('implicit index', () => {
        const wat = `
          (adapter module
            (import "imp" (instance
              (export "f" (func))
            ))
            (alias 0 0 (instance))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.instances[1]).toEqual({
          type: 'instance',
          alias: {
            type: 'outer',
            outerIdx: 0,
            kindIdx: 0,
          },
        })
      })

      test('explicit index', () => {
        const wat = `
          (adapter module
            (import "imp" (instance
              (export "f" (func))
            ))
            (alias 0 0 (instance $i))
          )
        `

        const parser = Parser()
        const adapterModule = pipe(parser, parseModule)(wat)
        indexAdapterModule(adapterModule)

        expect(adapterModule.symbolIndex.instances.$i).toBe(1)
        expect(adapterModule.instances[1]).toEqual({
          type: 'instance',
          name: '$i',
          alias: {
            type: 'outer',
            outerIdx: 0,
            kindIdx: 0,
          },
        })
      })
    })
  })
})
