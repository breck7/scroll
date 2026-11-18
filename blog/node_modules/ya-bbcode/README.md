# ya-bbcode
Yet another BBCode parser.
`npm install ya-bbcode --save`

[![npm version](https://badge.fury.io/js/ya-bbcode.svg)](https://badge.fury.io/js/ya-bbcode)
[![CI](https://github.com/nodecraft/ya-bbcode/actions/workflows/ci.yml/badge.svg)](https://github.com/nodecraft/ya-bbcode/actions/workflows/ci.yml)

## Usage

ya-bbcode works with both `import` and `require`, with TypeScript types for each:

```javascript
import yabbcode from 'ya-bbcode';
// or: const yabbcode = require('ya-bbcode');

const parser = new yabbcode();

const bbc = '[url=https://nodecraft.com]Visit Nodecraft[/url]';
parser.parse(bbc);
// <a href="https://nodecraft.com">Visit Nodecraft</a>
```

##### Options

Pass these to the constructor, as in `new yabbcode({ newline: false })`:

| Option | Default | Effect |
| --- | --- | --- |
| `newline` | `true` | Turn line breaks into `<br/>` |
| `paragraph` | `false` | Wrap the output in `<p>`, and with `newline` on, start a new paragraph at each line break |
| `cleanUnmatchable` | `true` | Drop tags that never pair up; when off, they are kept as written |
| `sanitizeHtml` | `true` | Escape HTML in the input |
| `allowedSchemes` | `['http', 'https', 'mailto', 'ftp', 'ftps']` | URL schemes allowed in links and images |
| `caseSensitive` | `false` | Match tag names exactly, so `[signal x]` can be a tag while `[Signal]` stays text. The built-in tags are lowercase |

##### Add Custom Tags

```javascript
parser.registerTag('url', {
	type: 'replace',
	open: (attr) => {
		const href = parser.sanitizeUrl(attr) ?? '#';
		return `<a href="${href}" rel="noopener noreferrer">`;
	},
	close: '</a>'
});

// Remove all default or registered tags
parser.clearTags();
```

There are three kinds of tag:

| Type | Options | Renders as |
| --- | --- | --- |
| `replace` | `open`, `close`, `autoClose`, `block` | `open` and `close` swapped in for the opening and closing tag, with the BBCode between them parsed as usual. `autoClose` closes a tag that has no closing tag of its own, like `[*]`. Each can be a function of `(attr, attrs, content)`, where `content` is the text between the tags as written, inner BBCode included. |
| `content` | `replace`, `raw`, `block` | Whatever `replace(attr, content, attrs)` returns, in place of the whole tag and its content. `content` is the inner BBCode already rendered to HTML, or with `raw: true` the inner text as written: BBCode and newlines untouched, so it suits code blocks. |
| `ignore` | | The content as plain text, like `[noparse]`. |

`block: true` marks a tag that renders as a block element, such as a heading, list or quote. The newline on each side of its opening and closing tags is dropped instead of becoming a stray `<br/>`, so `[list]\n[*]one\n[/list]` renders as `<ul><li>one</li></ul>`. It applies when `newline` is on and `paragraph` is off.

##### Attributes

Tag functions receive `attr`, the tag's main value, and `attrs`, its named attributes:

| BBCode | `attr` | `attrs` |
| --- | --- | --- |
| `[quote=Some user]` | `'Some user'` | `{}` |
| `[code lang=js skip-lint]` | `'js'` | `{ lang: 'js', 'skip-lint': true }` |
| `[quote=Some user post=12]` | `'Some user'` | `{ post: '12' }` |
| `[quote="Bob said x=5" post_id=1]` | `'Bob said x=5'` | `{ post_id: '1' }` |
| `[quote author=John Smith link=msg=12]` | `'John Smith'` | `{ author: 'John Smith', link: 'msg=12' }` |

Any value can be wrapped in `"double"` or `'single'` quotes, which are removed, and a quoted value may contain spaces, `=` and `]`. An unquoted value runs until the next word that is itself `key=value`, so words between two named attributes join the first one's value. Flags before or after them stay flags.

The built-in tags understand what popular forums export: `[quote]` shows just the author's name from phpBB, XenForo, Discourse, vBulletin, SMF and MyBB quotes, and `[list=1]`, `[list=a]`, `[list=A]`, `[list=i]` and `[list=I]` render numbered lists.

##### Escaping in custom tags

With `sanitizeHtml` on (the default), everything a tag function receives is already HTML-escaped, so it can go straight into HTML content. To use it anywhere else, use the parser's helpers. They work the same with `sanitizeHtml` on or off and never escape twice:

- `parser.sanitizeUrl(value)`: an escaped URL for `href` or `src`, or `undefined` when its scheme isn't in `allowedSchemes` (blocking `javascript:` and similar).
- `parser.escapeHtml(value)`: escaped text for HTML or a quoted attribute.
- `parser.unescapeHtml(value)`: the original text, for handing to something that escapes for itself, like a syntax highlighter.

### Why ya-bbcode?
 - **Supports nested BBCode**: Properly handles complex nested structures
 - **Zero dependencies**: Lightweight with no external dependencies
 - **Correct parsing**: Parent nodes are parsed before children in nested format
 - **Customizable**: Easy to add or override tags
 - **Fast**: Single-pass parser, benchmarked against other BBCode libraries on every pull request

### Benchmarks
`npm run build && npm run bench` compares ya-bbcode with other BBCode parsers on a set of documents, checks that ya-bbcode's output for each one is exactly the expected HTML, and measures how parse time grows with input size. The run fails if any output is wrong or if parsing stops scaling linearly.

Options go after `--`, for example `npm run bench -- --filter list --time 200`:

| Option | Effect |
| --- | --- |
| `--baseline <path>` | Also measure another build of ya-bbcode (such as a copy of `dist/ya-bbcode.mjs` from `main`) and report the speed-up against it |
| `--filter <text>` | Only run the cases whose name contains the text |
| `--time <ms>` | Time spent measuring each row (default 500) |
| `--json <path>` | Write every measurement to a file |
| `--skip-scaling` | Skip the input-size scaling section |

Results in operations per second (higher is better) on Node 26. `@bbob/parser` only builds a syntax tree; the others render HTML.

| Case | ya-bbcode | @bbob/html | @bbob/parser | xbbcode-parser |
| --- | --- | --- | --- | --- |
| Short (Simple Bold) | 1,332,547 | 235,282 | 424,036 | 91,371 |
| Medium (Nested Quote) | 491,735 | 87,204 | 121,491 | 37,869 |
| Long (Forum Post) | 127,402 | 12,903 | 17,326 | 9,979 |
| Complex (Deep Nesting) | 118,430 | 15,553 | 28,828 | 6,647 |
| Deep Nesting (5 levels) | 350,429 | 73,014 | 106,916 | 33,048 |
| URL Heavy (10 links) | 120,075 | 16,972 | 21,327 | 11,349 |
| List Heavy (50 items) | 25,089 | 1,472 | 3,020 | 831 |
| Image Gallery (12 linked images) | 43,998 | 8,296 | 13,140 | 5,519 |
| Plain Text (no tags) | 763,489 | 19,877 | 21,855 | 124,293 |
| HTML Heavy (escaping) | 70,404 | 9,613 | 10,475 | 37,385 |
| Noparse Block (90 literal tags) | 99,867 | 3,434 | 5,144 | 11,101 |
| Malformed (tag soup) | 114,333 | 22,687 | 28,185 | 21,300 |
| Guide (8 mixed sections) | 13,558 | 1,574 | 2,939 | 1,160 |
| Large Document (BBob stub) | 4,469 | 652 | 959 | 266 |

### Changelog
Release notes are published on [GitHub Releases](https://github.com/nodecraft/ya-bbcode/releases). Notes for 5.0.0 and earlier are in [CHANGELOG.md](CHANGELOG.md).
