# is-actual-promise

Similar to [`p-is-promise`](https://npmjs.com/p-is-promise) and
[`is-promise`](https://npmjs.com/is-promise), which are also both
fine alternatives to this.

Differences (ie, "why this thing then?")

* This module is hybrid, so it can be used in either commonjs or
  esm. `is-promise` is hybrid, but `p-is-promise` is ESM-only.
* This module asserts that the tested value supplies the full
  actual `Promise` interface, not just `PromiseLike` (ie, it also
  asserts `.catch()` and `.finally()`. (`p-is-promise` tests for
  `.catch()`, neither tests for `.finally()`.)
* This module provides a named export rather than a default
  export, which is a bit less of a hassle in some scenarios.
* This module does not verify the resolution type of the Promise,
  since that cannot be determined or verified, only that it's a
  `Promise<any | void>`.

(Note that this module does _not_ verify that the `.catch()`,
`.then()`, and `.finally()` methods return Promises, because that
is impossible at run-time without actually calling them. No
duck-typing method should ever be considered fully
authoritative.)

## USAGE

```ts
import { isPromise } from 'is-actual-promise'

console.log(isPromise(new Promise(() => {}))) // true
console.log(isPromise((async () => true)())) // true
console.log(isPromise(Promise.resolve(true))) // true
console.log(isPromise({
  then: async () => 5,
  finally: async () => {},
  catch: () => {},
})) // true, but not accurate, limitation of duck typing
```
