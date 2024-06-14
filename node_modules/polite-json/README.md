# polite-json

This is a Node.js library for getting nicer errors out of
`JSON.parse()`, including context and position of the parse
errors.

It also preserves the newline and indentation styles of the JSON
data, by putting them in the object or array in the
`Symbol.for('indent')` and `Symbol.for('newline')` properties, so
that if you `stringify()` the object you parsed, it'll be
formatted with the same indentation and newlines (in most cases,
it's not a super clever streaming in-place editor, it just uses
the first line break and indentation it sees).

## Install

`$ npm install --save polite-json`

### Example

```js
import { parse, parseNoExceptions, stringify } from 'polite-json'
// or: const { parse, stringify } = require('polite-json')

parse('"foo"') // returns the string 'foo'
const obj = parse('{\r\n\t"hello": "world"\r\n}') // { hello: 'world' }
stringify(obj) // stringifies with \r\n line breaks, \t indentation
parse('garbage') // more useful error message
parseNoExceptions('garbage') // no error, just undefined
```

### Features

- Like JSON.parse, but the errors are better, and style choices
  are (mostly) preserved.
- Strips a leading byte-order-mark that you sometimes get reading files.
- Has a `noExceptions` method that returns undefined rather than throwing.
- Attaches the newline character(s) used to the `Symbol.for('newline')`
  property on objects and arrays.
- Attaches the indentation character(s) used to the `Symbol.for('indent')`
  property on objects and arrays.

## Indentation

Indentation and newline information is saved on the
`Symbol.for('indent')` and `Symbol.for('newline')` properties,
respectively. This is usually not a problem for JSON objects,
since JSON ignores symbols, but if you are using them for some
other purpose, it could cause weird behavior.

Indentation is determined by looking at the whitespace between
the initial `{` and `[` and the character that follows it. If
you have lots of weird inconsistent indentation, then it won't
track that or give you any way to preserve it. Whether this is a
bug or a feature is debatable ;)

### API

#### `parse(txt, reviver = null, context = 20)`

Works just like `JSON.parse`, but will include a bit more
information when an error happens, and attaches a
`Symbol.for('indent')` and `Symbol.for('newline')` on objects and
arrays. This throws a `JSONParseError`.

#### `parseNoExceptions(txt, reviver = null)`

Works just like `JSON.parse`, but will return `undefined` rather
than throwing an error.

#### `class JSONParseError(er, text, context = 20, caller = null)`

Extends the JavaScript `SyntaxError` class to parse the message
and provide better metadata.

Pass in the error thrown by the built-in `JSON.parse`, and the
text being parsed, and it'll parse out the bits needed to be
helpful.

`context` defaults to 20.

Set a `caller` function to trim internal implementation details
out of the stack trace. When calling `parseJson`, this is set to
the `parseJson` function. If not set, then the constructor
defaults to itself, so the stack trace will point to the spot
where you call `new JSONParseError`.

#### `stringify(obj, reviver = undefined, indent = undefined)`

If the object was parsed using the `parse()` methods in this
library, then it will default to using the same indentation and
newline strings that were detected, if relevant.

If `indent` is set, then the stored formatting information is
ignored, and `\n` newlines will be used.

A final newline will be appended if indentation is used.
