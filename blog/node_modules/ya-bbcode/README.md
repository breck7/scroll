# ya-bbcode
Yet another BBCode parser.
`npm install ya-bbcode --save`

[![npm version](https://badge.fury.io/js/ya-bbcode.svg)](https://badge.fury.io/js/ya-bbcode)
[![Actions Status](https://github.com/nodecraft/ya-bbcode/workflows/Test/badge.svg)](https://github.com/nodecraft/ya-bbcode/actions)
[![Coverage Status](https://coveralls.io/repos/github/nodecraft/ya-bbcode/badge.svg)](https://coveralls.io/github/nodecraft/ya-bbcode)

## Usage

```javascript
const yabbcode = require('ya-bbcode');
const parser = new yabbcode();

const bbc = '[url=https://nodecraft.com]Visit Nodecraft[/url]';
parser.parse(bbc);
// <a href="https://nodecraft.com">Visit Nodecraft</a>
```

##### Add Custom Tags

```javascript
parser.registerTag('url', {
	type: 'replace',
	open: (attr) => {
		return `<a href="${attr || '#'}" rel="noopener norefer">`;
	},
	close: '</a>'
});

// Remove all default or registered tags
parser.clearTags();
```

### Why ya-bbcode?
 - **Supports nested BBCode**: Properly handles complex nested structures
 - **Zero dependencies**: Lightweight with no external dependencies
 - **Correct parsing**: Parent nodes are parsed before children in nested format
 - **Customizable**: Easy to add or override tags
