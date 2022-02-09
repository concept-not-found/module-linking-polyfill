export default (dedent) => [
  {
    name: 'two instances of a module with independent memory',
    watSource: dedent`
      (adapter module
        (module $M
          (memory 1)
          (func $store (param $value i32)
            (i32.const (;address;) 0)
            (local.get $value)
            (i32.store)
          )
          (func $load (result i32)
            (i32.const (;address;) 0)
            (i32.load)
          )
          (export "store" (func $store))
          (export "load" (func $load))
        )
        (instance $m0 (instantiate $M))
        (func $store_m0 (alias $m0 "store"))
        (export "store instance 0" (func $store_m0))
        (func $load_m0 (alias $m0 "load"))
        (export "load instance 0" (func $load_m0))

        (instance $m1 (instantiate $M))
        (func $store_m1 (alias $m1 "store"))
        (export "store instance 1" (func $store_m1))
        (func $load_m1 (alias $m1 "load"))
        (export "load instance 1" (func $load_m1))
      )
    `,
    jsSource: dedent`
      const {exports} = moduleLinkingPolyfillRuntime(config)
      console.log("load instance 0:", exports["load instance 0"]())
      console.log("load instance 1:", exports["load instance 1"]())

      exports["store instance 1"](42)
      console.log("store instance 1 = 42")

      console.log("load instance 0:", exports["load instance 0"]())
      console.log("load instance 1:", exports["load instance 1"]())
    `,
    expectedJsConsole: dedent`
      load instance 0: 0
      load instance 1: 0
      store instance 1 = 42
      load instance 0: 0
      load instance 1: 42
    `,
  },
  {
    name: 'module shares memory with another',
    watSource: dedent`
      (adapter module
        (module $Loader
          (memory $memory 1)
          (export "mem" (memory $memory))
          (func $load (result i32)
            (i32.const (;address;) 0)
            (i32.load)
          )
          (export "load" (func $load))
        )
        (module $Storer
          (memory (import "imp" "mem") 1)
          (func $store (param $value i32)
            (i32.const (;address;) 0)
            (local.get $value)
            (i32.store)
          )
          (export "store" (func $store))
        )
        (instance $loader (instantiate $Loader))
        (func $load (alias $loader "load"))
        (export "load from loader" (func $load))

        (instance $storer (instantiate $Storer
          (import "imp" (instance $loader))
        ))
        (func $store (alias $storer "store"))
        (export "store into storer" (func $store))
      )
    `,
    jsSource: dedent`
      const {exports} = moduleLinkingPolyfillRuntime(config)
      console.log("load from loader:", exports["load from loader"]())

      exports["store into storer"](42)
      console.log("store into storer = 42")

      console.log("load from loader:", exports["load from loader"]())
    `,
    expectedJsConsole: dedent`
      load from loader: 0
      store into storer = 42
      load from loader: 42
    `,
  },
  {
    name: 're-export instance func',
    watSource: dedent`
      (adapter module
        (instance $i (import "imp")
          (export "f" (func (result i32)))
        )
        (func $f (alias $i "f"))
        (export "exp" (func $f))
      )
    `,
    jsSource: dedent`
      const imports = {
        imp: {
          f() {
            return 42
          }
        }
      }
      const {exports: {exp}} = moduleLinkingPolyfillRuntime(config, imports)
      console.log("exp() ===", exp())
    `,
    expectedJsConsole: dedent`
      exp() === 42
    `,
  },
  {
    name: 'adapter module is closed over import',
    watSource: dedent`
      (adapter module $Outer
        (func $f (import "imp") (result i32))
        (adapter module $Inner
          (func $g (alias $Outer $f))
          (export "inner-exp" (func $g))
        )
        (instance $m (instantiate $Inner))
        (func $h (alias $m "inner-exp"))
        (export "exp" (func $h))
      )
    `,
    jsSource: dedent`
      const imports = {
        imp() {
          return 42
        }
      }
      const {exports: {exp}} = moduleLinkingPolyfillRuntime(config, imports)
      console.log("exp() ===", exp())
    `,
    expectedJsConsole: dedent`
      exp() === 42
    `,
  },
  {
    name: 're-export all kinds',
    watSource: dedent`
      (adapter module (;0;)
        (module $a (import "impmodule"))
        (instance $b (import "impinstance"))
        (func $c (import "impfunc"))
        (table $d (import "imptable"))
        (memory $e (import "impmemory"))
        (global $f (import "impglobal"))
        (export "expmodule" (module $a))
        (export "expinstance" (instance $b))
        (export "expfunc" (func $c))
        (export "exptable" (table $d))
        (export "expmemory" (memory $e))
        (export "expglobal" (global $f))
      )
    `,
    jsSource: dedent`
      const imports = {
        impmodule: Symbol(),
        impinstance: Symbol(),
        impfunc: Symbol(),
        imptable: Symbol(),
        impmemory: Symbol(),
        impglobal: Symbol()
      }
      const {exports: {
        expmodule,
        expinstance,
        expfunc,
        exptable,
        expmemory,
        expglobal
      }} = moduleLinkingPolyfillRuntime(config, imports)
      console.log("impmodule === expmodule", imports.impmodule === expmodule)
      console.log("impinstance === expinstance", imports.impinstance === expinstance)
      console.log("impfunc === expfunc", imports.impfunc === expfunc)
      console.log("imptable === exptable", imports.imptable === exptable)
      console.log("impmemory === expmemory", imports.impmemory === expmemory)
      console.log("impglobal === expglobal", imports.impglobal === expglobal)
    `,
    expectedJsConsole: dedent`
      impmodule === expmodule true
      impinstance === expinstance true
      impfunc === expfunc true
      imptable === exptable true
      impmemory === expmemory true
      impglobal === expglobal true
    `,
  },
]
