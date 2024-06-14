# async-hook-domain

An implementation of the error-handling properties of the
deprecated `domain` node core module, re-implemented on top of
[`async_hooks`](https://nodejs.org/api/async_hooks.html).

## USAGE

```js
// hybrid module, either works
import { Domain } from 'async-hook-domain'
// or: const { Domain } = require('async-hook-domain')

// instantiating a Domain attaches it to the current async execution
// context, and all child contexts that come off of it.  You don't have
// to call d.enter() or d.run(cb), just instantiate and it's done.
// Pass an error-handling function to the constructor.  This function
// will be called whenever there is an uncaught exception or an
// unhandled Promise rejection.

const d = new Domain(er => {
  console.log('caught an error', er)
  // if you re-throw, it's not going to be caught, and will probably
  // cause the process to crash.
})

setTimeout(() => {
  throw new Error('this is caught by the domain a few lines up')
})

process.nextTick(() => {
  const d2 = new Domain(er => {
    console.log('any contexts spawned from this nextTick are caught here', er)
    // only catch one error.  The next one will go to the parent
    d2.destroy()
  })
  fs.readFile('does not exist', (er, data) => {
    if (er) throw er
  })
  fs.readFile('also does not exist', (er, data) => {
    if (er) throw er
  })
})

// Adding a new domain here in the same context as the d above will
// take over for this current context, as well as any that are created
// from now on.  But it won't affect the setTimeout above, because that
// async context was created before this domain existed.
const d3 = new Domain(er => console.log('d3', er))

// Unhandled promise rejections are handled, too.
Promise.reject(new Error('this will be handled by d3'))

// since a Promise rejection is an async hop, if we destroyed it right
// now, it would not be there to catch the Promise.reject event.
setTimeout(() => {
  // destroying d3 makes it like it never happened, so this will
  // be handled by the parent domain we created at the outset.
  d3.destroy()
  throw new Error('this will be handled by the parent')
})

// When all domains are destroyed either manually or by virtue of their
// async execution contexts being completed, or if no domain is active
// for the current execution context, then it reverts back to normal
// operation, with all event handlers removed and everything cleaned up.
setTimeout(() => {
  d.destroy()
  throw new Error('this crashes the process like normal')
}, 500) // time for the other contexts to wrap up
```

If you want to limit a Domain to a narrower scope, you can use
node's
[`AsyncResource`](https://nodejs.org/api/async_hooks.html#async_hooks_class_asyncresource)
class, and instantiate the domain within its
`runInAsyncScope(cb)` method. From then on, the domain will only
be active when running from that Async Resource's scope.

## Important `new Promise()` Construction Method Caveat

If you create a domain within a `Promise` construction method,
then rejections of that promise will only be handled by the
domain that was active when the Promise constructor was
instantiated, and _not_ the new domain you create within the
constructor.

This is because, even though the _rejection_ happens later, and
any throws are deferred until that time, the Promise construction
method _itself_ is run synchronously. So, the
`executionAsyncId()` in that context is still the same as it was
when the Promise constructor was initiated.

For example:

```js
import { Domain } from 'async-hook-domain'

const d1 = new Domain(() => console.log('handled by d1'))
new Promise((_, reject) => { // <-- Promise bound to d1 domain

  // executionAsyncId identical to outside the Promise constructor

  // domains created later have no effect, Promise already bound,
  // as it was created at the instant of calling new Promise()
  // this is actually a new domain handling any subsequent throws
  // in the *parent* context! confusing!
  const d2 = new Domain(() => console.log('handled by d2'))

  // timeout created in d2's context, *sibling* of eventual
  // promise resolution/rejection
  setTimeout(() => {
    // d3 created as child of d2, but nothing bound to it
    // would handle any new async behaviors triggered by
    // the setTimeout's async context
    const d3 = new Domain(() => console.log('handled by d3'))

    // rejection occurs in child context, triggered by
    // execution context where new Promise was initiated.
    reject(new Error('will be handled by d1!'))
  })
})
```

Since Promise construction happens synchronously in the same
`executionAsyncId()` contex as outside the function, domains
created within that context are as if they were created outside
of the Promise constructor, and will stack up for that context.

For example:

```js
import { Domain } from 'async-hook-domain'

// executionAsyncId=1, domain added
const d1 = new Domain(() => console.log('handled by d1'))
new Promise((_, reject) => {
  // still executionAsyncId=1, new child domain takes over
  // this is the new active domain for executionAsyncId=1,
  // even outside the Promise constructor!
  const d2 = new Domain(() => console.log('handled by d2'))
  // setTimeout creates new executionAsyncId=3, bound to d2
  setTimeout(() => {
    // executionAsyncId=3, d3 handling any errors in it
    const d3 = new Domain(() => console.log('handled by d3'))
    // resolve happens in executionAsyncId=2, the promise
    // resolution context triggered by the new Promise call
    resolve('this is fine')
  })
})

// throw happens in executionAsyncId=1, current domain is d2!
throw new Error('will be handled by d2!')
```

Note that since a throw within a `Promise` construction method is
treated as a call to `reject()`, this also applies to thrown
errors within the construction method:

```js
import { Domain } from 'async-hook-domain'
const d1 = new Domain(() => console.error('handled by d1'))
new Promise((_, reject) => {
  const d2 = new Domain(() => console.error('handled by d2'))

  throw 'this will be handled by d1, not d2!'
})
```

The execution context of the Promise itself is bound to the
domain that was active at the time the Promise constructor
_started_, so any rejection will be handled by that domain.

If this all sounds confusing and very deep in the weeds, a safe
approach is to never create a new `Domain` within a Promise
construction function. Then everything will behave as you'd
expect.

I have explored the space here thoroughly, because this strikes
me as counter-intuitive. As a user, I'd expect that a new domain
created in a Promise constructor method would be a child of the
domain that binds _to the Promise resolution_, and thus take over
handling the subsequent Promise rejection, rather than binding to
the context outside the Promise constructor.

But that isn't how it works, and as of version 19, Node.js and v8
do not provide adequate API surface to make it behave that way
without making _other_ behavior less reliable. A future
SemVer-major change will address this caveat when and if it
becomes possible to do so.

## API

### `process.env.ASYNC_HOOK_DOMAIN_DEBUG = '1'`

Set the `ASYNC_HOOK_DOMAIN_DEBUG` environment variable to `'1'`
to print a lot of debugging information to stderr.

### const d = new Domain(errorHandlerFunction(error, type))

Create a new Domain and assign it to the current execution
context and all child contexts that the current one triggers.

The handler function is called with two arguments. The first is
the error that was thrown or the rejection value of the rejected
Promise. The second is either `'uncaughtException'` or
`'unhandledRejection'`, depending on the type of event that
raised the error.

Note that even if the Domain prevents the process from failing
entirely, Node.js _may_ still print a warning about unhandled
rejections, depending on the `--unhandled-rejections` option.

### d.parent Domain

If a Domain is already assigned to the current context on
creation, then the current Domain set as the new Domain's
`parent`. On destruction, any of a Domain's still-active
execution contexts are assigned to its parent.

### d.onerror Function

The `errorHandlerFunction` passed into the constructor. Called
when an uncaughtException or unhandledRejection occurs in the
scope of the Domain.

If this function throws, then the domain will be destroyed, and
the thrown error will be raised. If the domain doesn't have a
parent, then this will likely crash the process entirely.

### d.destroyed Boolean

Set to `true` if the domain is destroyed.

### d.ids Set

A set of the `executionAsyncId` values corresponding to the
execution contexts for which this Domain handles errors.

### d.destroy() Function

Call to destroy the domain. This removes it from the system
entirely, assigning any outstanding ids to its parent, if it has
one, or leaving them uncovered if not.

This is called implicitly when the domain's last covered
execution context is destroyed, since at that point, the domain
is unreachable anyway.
