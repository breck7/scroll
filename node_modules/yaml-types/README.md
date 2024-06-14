# yaml-types

Additional useful types for [`yaml`](https://github.com/eemeli/yaml).

## Installation and Usage

```
npm install yaml yaml-types
```

Each type (a.k.a. "tag") is available as a named export of `'yaml-types'`.
These may then be used as [custom tags](https://eemeli.org/yaml/#writing-custom-tags):

```js
import { parse } from 'yaml'
import { regexp } from 'yaml-types'

const re = parse('!re /fo./g', { customTags: [regexp] })
'foxbarfoo'.match(re) // [ 'fox', 'foo' ]
```

## Available Types

- `bigint` (`!bigint`) - JavaScript [BigInt] values.
  Note: in order to use this effectively,
  a function must be provided as `customTags` in order to prepend the `bigint` tag,
  or else the built-in `!!int` tags will take priority.
  See [bigint.test.ts](./src/bigint.test.ts) for examples.
- `classTag` (`!class`) - JavaScript [Class] values
- `error` (`!error`) - JavaScript [Error] objects
- `functionTag` (`!function`) - JavaScript [Function] values
  (will also be used to stringify Class values,
  unless the `classTag` tag is loaded ahead of `functionTag`)
- `nullobject` (`!nullobject) - Object with a `null` prototype
- `regexp` (`!re`) - [RegExp] values,
  using their default `/foo/flags` string representation.
- `sharedSymbol` (`!symbol/shared`) - [Shared Symbols],
  i.e. ones created with `Symbol.for()`
- `symbol` (`!symbol`) - [Unique Symbols]

The function and class values created by parsing `!function` and
`!class` tags will not actually replicate running code, but
rather no-op function/class values with matching name and
`toString` properties.

[BigInt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
[Class]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
[Error]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[Function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions
[RegExp]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
[Shared Symbols]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol#shared_symbols_in_the_global_symbol_registry
[Unique Symbols]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol

## Customising Tag Names

To use one of the types with a different tag identifier, set its `tag` value accordingly.
For example, to extend the default tag namespace with `!!js/regexp`
instead of using a local `!re` tag for RegExp values:

```js
import { stringify } from 'yaml'
import { regexp } from 'yaml-types'

const myregexp = { ...regexp, tag: 'tag:yaml.org,2002:js/regexp' }
stringify(/fo./m, { customTags: [myregexp] })
```

```yaml
!!js/regexp /fo./m
```

To use a named tag handle like `!js!regexp`, a few more steps are required:

```js
import { Document } from 'yaml'
import { regexp } from 'yaml-types'

const myregexp = { ...regexp, tag: 'tag:js:regexp' }
const doc = new Document(/fo./m, { customTags: [myregexp] })
doc.directives.tags['!js!'] = 'tag:js:'
doc.toString()
```

```yaml
%TAG !js! tag:js:
---
!js!regexp /fo./m
```

## Contributing

Additions to this library are very welcome!
Many data types are useful beyond any single project,
and while the core `yaml` library is mostly limited to the YAML spec,
no such restriction applies here.

The source code is written in [TypeScript], and the tests use [Node-Tap].
When submitting a PR for a new type, tests and documentation are required,
as well as satisfying [Prettier].

[TypeScript]: https://www.typescriptlang.org/
[Node-Tap]: https://node-tap.org/
[Prettier]: https://prettier.io/
