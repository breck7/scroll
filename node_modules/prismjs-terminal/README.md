# prismjs-terminal

[PrismJS](https://prismjs.com), but for terminal output.

## USAGE

```js
// ESM only, sorry, blame chalk
// But less reason to use CommonJS for new CLI apps anyway
import { highlight } from 'prismjs-terminal'

// get some code somehow
import { readFileSync } from 'fs'
const code = readFileSync('some-file.ts', 'utf8')

// highlight it
console.log(highlight(code, 'typescript'))
```

## Custom Themes

Instead of CSS, themes are defined using an object with
styling functions that take a string and return a string.

The `_` style rule applies to the block as a whole, and is used
as the default style. This is where you'd usually port a PrismJS
theme's `code[class*="language-"]` css rule.

The `lineNumber` style rule will apply to line numbers, if they
are used.

The semantics are similar to CSS, where a nested property will be
applied to nodes within that nesting stack with a higher
priority the more tags that match, and later rules taking
precedence over earlier ones. It's _not_ a full CSS selector
syntax though, so things like `.token.italic.bold` aren't
supported. Just individual token class names, possibly nested.
Also, chalk is not CSS, and a terminal is not a browser, so
there are some differences and limitations of course.

Aliases are also not supported, styles have to be applied to the
actual parsed class names PrismJS provides.

For example:

```js
import { defaultTheme, Theme } from 'prismjs-terminal'
import chalk from 'chalk'
const theme: Theme = {
  // any (s:string)=>string function is allowed
  comment: chalk.hex('#d75fff').italic,

  // can provide multiple functions, which is useful if they
  // aren't chainable chalk methods
  function: [chalk.hex('#f08'), s => ` >${s}< `],

  // nest by separating with a space
  // will turn `/abc/gm` into:
  // chalk.bold('/' + chalk.green('abc') + '/' + chalk.blue('gm'))
  regex: chalk.bold,
  'regex regex-source': chalk.green,
  'regex regex-flags': chalk.blue,

  // apply one style to multiple token names by separating with `,`
  'string, number': chalk.green,

  // See the defaultTheme export for more examples.
}
console.log(highlight(code, 'typescript', { theme }))

// can also use one of the included ones
console.log(highlight(code, 'typescript', { theme: 'xonokai' }))
```

See [the themes directory in this repo](./themes) for more
examples.

## API

- interface `PrismJSTerminalOpts`

  - `theme` The theme to use. Either a Theme object, or a
    string identifying one of the built-in themes. Defaults to
    `'moria'`.
  - `language` The language of the supplied code to highlight.
    Defaults to `tsx` if no filename is provided, or else
    tries to infer the language from the filename. You must
    have previously called `loadLanguages([...])` from
    `PrismJS` in order to highlight a given language, if you
    want something that is not automatically included when
    `tsx` and `typescript` are included.
  - `minWidth` The minimum width to make the block on the
    screen. Defaults to `0`.
  - `maxWidth` The maximum width to make the block on the
    screen. Defaults to `process.stdout.columns` or `80`.
  - `padding` How many spaces to horizontally pad the code
    block. Defaults to `1`.
  - `lineNumbers` Whether or not to prepend a line number to each
    line. Defaults to `false`.

- `highlight(code: string, opts?: PrismJSTerminalOpts): string`

  Highlight the string of code provided, returning the string of
  highlighted code.

- `highlightFile(filename: string, opts?: PrismJSTerminalOpts): Promise<string>`

  Read the filename provided, and highlight its code. If a
  language is not provided in the opts, it will attempt to infer
  from the filename.

- `highlightFileSync(filename: string, opts?: PrismJSTerminalOpts): string`

  Synchronous `highlightFile`.

- Themes:

  More are welcome! If you have a PrismJS theme you like, do
  send a PR. Of course not everything translates, but it's quite
  straightforward to take a PrismJS CSS file and turn all the
  `color: #...` lines into `chalk.hex('#...')` calls.

  Theme objects can be either a Map or object where the keys are
  the selectors and the values are either a styling function or
  an array of styling functions to be applied in order.

  - `debug` This just dumps the code wrapped in `<tag>...</tag>`
    to see what the token names are. Useful for tests and such.
  - `plain` No styling, just the code as plain text.
  - `github` Port of GHColors prismjs theme.
  - `moria` Inspired by Vim Moria color scheme.
  - `prismDark` Port of the `prism-dark` PrismJS theme.
  - `xonokai` Port of the `xonokai` PrismJS theme.
