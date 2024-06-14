# resolve-import

Look up the file that an `import()` statement will resolve to,
for use in node esm loaders.

Returns a `file://` URL object for file resolutions, or the
builtin module ID string for node builtins.

## USAGE

```js
import { resolveImport } from 'resolve-import'
// or: const { resolveImport } = require('resolve-import')

// resolving a full file URL just returns it
console.log(await resolveImport(new URL('file:///blah/foo.js')))

// resolving a node built in returns the string
console.log(await resolveImport('node:fs')) // 'node:fs'

// resolving an absolute full path just file-url-ifies it
console.log(await resolveImport('/a/b/c.js')) // URL(file:///a/b/c.js)

// resolving a relative path resolves it from the parent module
// URL(file:///path/to/x.js)
console.log(await resolveImport('./x.js', '/path/to/y.js'))

// packages resolved according to their exports, main, etc.
// eg: URL(file:///path/node_modules/pkg/dist/mjs/index.js)
console.log(await resolveImport('pkg', '/path/to/y.js'))
```

## API

These functions are all exported on the main module, as well as
being available on `resolve-import/{hyphen-name}`, for example:

```js
import { resolveAllExports } from 'resolve-import/resolve-all-exports'
```

### Interface `ResolveImportOpts`

- `conditions: string[]` The list of conditions to match on.
  `'default'` is always accepted. Defaults to `['import', 'node']`.

### resolveImport

```ts
resolveImport(
  url: string | URL,
  parentURL?: string | URL,
  options?: ResolveImportOpts):
    Promise<string | URL>
```

- `url` The string or file URL object being imported.
- `parentURL` The string or file URL object that the import is
  coming from.
- `options` A ResolveImportOpts object (optional)

Returns the string provided for node builtins, like `'fs'` or
`'node:path'`.

Otherwise, resolves to a `file://` URL object corresponding to
the file that will be imported.

Raises roughly the same errors that `import()` will raise if the
lookup fails. For example, if a package is not found, if a
subpath is not exported, etc.

### resolveAllExports

```ts
resolveAllExports(
  packageJsonPath: string | URL,
  options: ResolveImportOpts):
    Promise<Record<string, string | URL>>
```

Given a `package.json` path or file URL, resolve all valid
exports from that package.

If the pattern contains a `*` in both the pattern and the target,
then it will search for all possible files that could match the
pattern, and expand them appropriately in the returned object.

In the case where a `*` exists in the pattern, but does not exist
in the target, no expansion can be done, because _any_ string
there would resolve to the same file. In that case, the `*` is
left in the pattern.

If the target is a node built-in module, it will be a string.
Otherwise, it will be a `file://` URL object.

Any exports that fail to load (ie, if the target is invalid, the
file does not exist, etc.) will be omitted from the returned
object.

### resolveAllLocalImports

```ts
resolveAllLocalImports(
  packageJsonPath: string | URL,
  options: ResolveImportOpts):
    Record<string, string | URL>
```

Similar to `resolveAllExports`, but this resolves the entries in
the package.json's `imports` object.

### isRelativeRequire

```ts
isRelativeRequire(specifier: string): boolean
```

Simple utility function that returns true if the import or
require specifier starts with `./` or `../` (or `.\` or `..\` on
Windows).

### getAllConditions

```ts
getAllConditions(
  importsExports: Imports | Exports
): string[]
```

Given an `exports` or `imports` value from a package, return the
list of conditions that it is sensitive to.

`default` is not included in the returned list, since that's
always effectively relevant.

Note that a condition being returned by this method does not mean
that the export/import object actually has a _target_ for that
condition, since it may map to `null`, be nested under another
condition, etc. But it does potentially have some kind of
conditional behavior for all the conditions returned.

Ordering of returned conditions is arbitrary, and does not imply
precedence or object shape.

### resolveConditionalValue

```ts
resolveConditionalValue(
  cond: ConditionalValue,
  options: ResolveImportOpts): string | null
```

Given an entry from an `imports` or `exports` object, resolve the
conditional value based on the `conditions` list in the provided
`options` object. By default, resolves with the conditions
`['import', 'node']`.

### getAllConditionalValues

```ts
getAllConditionalValues(
  importsExports: Imports | Exports
): string[]
```

Given an `exports` or `imports` value from a package, return the
list of all possible conditional values that it might potentially
resolve to, for any possible set of import conditions.

Filters out cases that are unreachable, such as conditions that
appear after a `default` value, or after a set of conditions that
would have been satisfied previously.

For example:

```json
{
  "import": { "node": "./x.js" },
  "node": { "import": { "blah": "./y.js" } }
}
```

Will return `['./x.js']`, omitting the unreachable `'./y.js'`,
because the conditions ['import','node','blah'] would have been
satisfied by the earlier condition.

Note that this does _not_ mean that the target actually can be
imported, as it may not exist, be an incorrect module type, etc.

Star values are not expanded. For that, use `resolveAllExports`
or `resolveAllLocalImports`.

### getConditionalValuesList

```ts
getConditionalValuesList(
  importsExports: Imports | Exports
): [string, Set<string>, string | null][]
```

Given an `exports` or `imports` value from a package, return the
list of all possible conditional values that it might potentially
resolve to, for any possible set of import conditions, along with
the `Set<string>` of conditions, any superset of which will
result in the condition.

The first entry in the returned list is the submodule path, or
`'.'` if the value provided did not have submodule paths.

The list includes null results, since while these are not a valid
resolution per se, they do _prevent_ valid resolutions that match
the same conditions.
