# function-loop

Run a list of synchronous or asynchronous functions, and call a
function at the end.

## USAGE

```ts
import { loop } from 'function-loop'
// or `const { loop } = require('function-loop')

const loop = require('./dist/cjs/index.js').default

// synchronous usage
const list = [
  () => console.log(1),
  () => console.log(2),
  () => console.log(3),
]
const result = loop(list, () => {
  console.log('done')
  return true
}, (er) => {
  console.error('threw somehow', er)
})

console.log('result:', result)
// logs:
// 1
// 2
// 3
// done
// result: true

// asynchronous usage
const plist = [
  async () => console.log(1),
  async () => new Promise(resolve => setTimeout(resolve, 100)).then(() =>
    console.log(2)
  ),
  async () => console.log(3),
]
const presult = loop(plist, () => {
  console.log('done')
  return true
}, (er) => {
  console.error('threw somehow', er)
})

console.log('result:', presult)
presult.then(() => console.log('resolved'))
// logs:
// 1
// result: Promise { <pending> }
// 3
// 2
// resolved
```

## Zalgo Preserving

This module is
["zalgo-preserving"](http://blog.izs.me/post/59142742143/designing-apis-for-asynchrony),
meaning that synchronous returns will result in a sync call to
the supplied cb, and async calls will result in the done callback
being called asynchronously.  The loop will return a Promise
indicating when it is finished, if any async functions are
encountered.  It does not artificially defer if functions are
called synchronously.

## API

`loop(functionList, doneCallback, errorCallback)`

Run all the functions and then call the `doneCallback` or call
the `errorCallback` if there are any errors.

Functions are called without being bound to any object as `this`.

Functions can return a Promise to do async operations, or not if
they are done synchronously.  Throws and Promise rejection are
reported to the `errorCallback` provided.

Return value is the return value of the callback, or a `Promise`
resolving to the callback's return value if any of the functions
in the list return promises.
