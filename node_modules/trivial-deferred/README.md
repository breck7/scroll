# trivial-deferred

A very dead-simple trivial Deferred implementation

## USAGE

```ts
// hybrid module, either esm or cjs styles work
import { Deferred } from 'trivial-deferred'
// or
const { Deferred } = require('trivial-deferred')
// or even
import { Deferred } from 'https://unpkg.com/trivial-deferred/dist/mjs/index.js'

// type defaults to `unknown`, just like Promise<T>
// set to <void> to make TypeScript ok with calling d.resolve()
// with no argument.
const d = new Deferred<string>()
// promise is d.promise
// to make the promise reject, do d.reject(error)
// to make the promise resolve, do d.resolve(value)
d.resolve('a string')
assert.equal(await d.promise, 'a string')
```

That's about it!
