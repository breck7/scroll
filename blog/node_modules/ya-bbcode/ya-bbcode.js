'use strict';

class yabbcode {
	tags = {
		'url': {
			type: 'replace',
			open: attr => `<a href="${attr || '#'}">`,
			close: '</a>',
		},
		'quote': {
			type: 'replace',
			open: attr => `<blockquote author="${attr || ''}">`,
			close: '</blockquote>',
		},
		'b': {
			type: 'replace',
			open: '<strong>',
			close: '</strong>',
		},
		'u': {
			type: 'replace',
			open: '<u>',
			close: '</u>',
		},
		'i': {
			type: 'replace',
			open: '<i>',
			close: '</i>',
		},
		'h1': {
			type: 'replace',
			open: '<h1>',
			close: '</h1>',
		},
		'h2': {
			type: 'replace',
			open: '<h2>',
			close: '</h2>',
		},
		'h3': {
			type: 'replace',
			open: '<h3>',
			close: '</h3>',
		},
		'h4': {
			type: 'replace',
			open: '<h4>',
			close: '</h4>',
		},
		'h5': {
			type: 'replace',
			open: '<h5>',
			close: '</h5>',
		},
		'h6': {
			type: 'replace',
			open: '<h6>',
			close: '</h6>',
		},
		'code': {
			type: 'replace',
			open: '<code>',
			close: '</code>',
		},
		'strike': {
			type: 'replace',
			open: '<span class="yabbcode-strike">',
			close: '</span>',
		},
		'spoiler': {
			type: 'replace',
			open: '<span class="yabbcode-spoiler">',
			close: '</span>',
		},
		'list': {
			type: 'replace',
			open: '<ul>',
			close: '</ul>',
		},
		'olist': {
			type: 'replace',
			open: '<ol>',
			close: '</ol>',
		},
		'*': {
			type: 'replace',
			open: '<li>',
			close: null,
		},
		'img': {
			type: 'content',
			replace: (attr, content) => {
				if(!content) {
					return '';
				}
				return `<img src="${content}" alt="${attr || ''}"/>`;
			},
		},
		'noparse': {
			type: 'ignore',
		},
	};
	regex = {
		tags: /(\[[^\]^]+])/g,
		newline: /\r\n|\r|\n/g,
		placeholders: /\[TAG-[1-9]+]/g,
	};
	contentModules = {
		replace: (tag, module, content) => {
			let open = module.open;
			let close = module.close;
			if(typeof(open) === 'function') {
				open = open(tag.attr);
			}
			if(typeof(close) === 'function') {
				close = close(tag.attr);
			}
			// do the replace
			if(open && !tag.isClosing) {
				//content = content
				content = content.replace('[TAG-' + tag.index + ']', open);
			}
			if(close && tag.closing) {
				content = content.replace('[TAG-' + tag.closing.index + ']', close);
			}
			return content;
		},
		content: (tag, module, content) => {
			if(!tag.closing) { return content; }
			const openTag = '[TAG-' + tag.index + ']';
			const closeTag = '[TAG-' + tag.closing.index + ']';
			const start = content.indexOf(openTag);
			const end = content.indexOf(closeTag);
			let	replace = module.replace;

			const innerContent = content.slice(start + openTag.length, end);
			if(typeof(replace) === 'function') {
				replace = replace(tag.attr, innerContent);
			}

			const contentStart = content.slice(0, Math.max(0, start));
			const contentEnd = content.slice(end + closeTag.length);

			return contentStart + replace + contentEnd;
		},
		ignore: (tag, module, content) => {
			const openTag = '[TAG-' + tag.index + ']';
			const start = content.indexOf(openTag);
			let closeTag = '';
			let end = content.length;
			if(tag.closing) {
				closeTag = '[TAG-' + tag.closing.index + ']';
				end = content.indexOf(closeTag);
			}
			let innerContent = content.slice(start + openTag.length, end);
			innerContent = this.#ignoreLoop(tag.children, innerContent);
			const contentStart = content.slice(0, Math.max(0, start));
			const contentEnd = content.slice(end + closeTag.length);
			return contentStart + innerContent + contentEnd;
		},
	};
	constructor(config = {}) {
		this.config = {
			newline: true,
			paragraph: false,
			cleanUnmatchable: true,
			sanitizeHtml: true,
		};
		if(config.newline !== undefined) {
			this.config.newline = config.newline;
		}
		if(config.paragraph !== undefined) {
			this.config.paragraph = config.paragraph;
		}
		if(config.cleanUnmatchable !== undefined) {
			this.config.cleanUnmatchable = config.cleanUnmatchable;
		}
		if(config.sanitizeHtml !== undefined) {
			this.config.sanitizeHtml = config.sanitizeHtml;
		}
	}

	#ignoreLoop = function(tagsMap, content) {
		for(const tag of tagsMap) {
			content = content.replace('[TAG-' + tag.index + ']', tag.raw);
			if(tag.closing) {
				content = content.replace('[TAG-' + tag.closing.index + ']', tag.closing.raw);
			}
			if(tag.children.length > 0) {
				content = this.#ignoreLoop(tag.children, content);
			}
		}
		return content;
	};

	#contentLoop = function(tagsMap, content) {
		for(const tag of tagsMap) {
			let module = this.tags[tag.module];
			if(!module) {
				// ignore invalid BBCode
				module = {
					type: 'replace',
					open: tag.raw,
					close: tag.closing && tag.closing.raw || '',
				};
			}
			if(!this.contentModules[module.type]) {
				throw new Error('Cannot parse content block. Invalid block type [' + module.type + '] provided for tag [' + tag.module + ']');
			}
			content = this.contentModules[module.type](tag, module, content);
			if(tag.children.length > 0 && module.type !== 'ignore') {
				content = this.#contentLoop(tag.children, content);
			}
		}

		return content;
	};

	#tagLoop = function(tagsMap, parent) {
		let currentTagIndex = 0;
		while(currentTagIndex < tagsMap.length) {
			let found = false;
			if(tagsMap[currentTagIndex].matchTag !== null || tagsMap[currentTagIndex].isClosing) {
				currentTagIndex++;
				continue; // already handled this tag / not closing
			}
			for(const [i, item] of tagsMap.entries()) {
				if(
					found ||
					tagsMap[currentTagIndex].matchTag !== null ||
					item.index === tagsMap[currentTagIndex].index ||
					item.matchTag !== null ||
					!item.isClosing ||
					tagsMap[currentTagIndex].module !== item.module
				) {
					continue;
				}
				tagsMap[i].matchTag = tagsMap[currentTagIndex].index;
				tagsMap[currentTagIndex].matchTag = item.index;
				found = i; // next index
			}

			const childStart = currentTagIndex + 1;

			if(found !== false) {
				tagsMap[currentTagIndex].closing = tagsMap[tagsMap[currentTagIndex].matchTag];
			}else{
				tagsMap[currentTagIndex].matchTag = false;
				found = tagsMap.length - 1;
			}

			// sweep children
			if(childStart < found) {
				tagsMap[currentTagIndex].children = tagsMap.slice(childStart, found).map((child) => {
					child.parent = tagsMap[currentTagIndex].index;
					return child;
				});
			}

			let i = childStart;
			while(i < found) {
				tagsMap[i].parent = tagsMap[currentTagIndex].index;
				i++;
			}

			currentTagIndex++; // move on
		}

		// sweep children & matched closing tags
		// TODO: make this more readable
		tagsMap = tagsMap.filter(item => !((parent === undefined && item.parent !== null) || (item.parent !== null && item.parent !== parent) || item.isClosing));

		return tagsMap.map((tag) => {
			if(tag.children.length > 0) {
				tag.children = this.#tagLoop(tag.children, tag.index);
			}
			return tag;
		});
	};

	clearTags() {
		this.tags = {};
		return this;
	}

	registerTag(tag, options) {
		this.tags[String(tag).toLowerCase()] = options;
		return this;
	}

	parse(bbcInput) {
		if(typeof(bbcInput) === 'boolean' || typeof(bbcInput) !== 'string' && Number.isNaN(Number(bbcInput))) { return ''; }
		// eslint-disable-next-line unicorn/prefer-spread
		let input = String(bbcInput).slice(0); // cheap string clone
		if(this.config.sanitizeHtml) {
			input = input
				.replaceAll('&', '&amp;')
				.replaceAll('<', '&lt;')
				.replaceAll('>', '&gt;')
				.replaceAll('"', '&quot;')
				.replaceAll('\'', '&#39;');
		}

		// reset
		let tagsMap = [];
		// split input into tags by index
		const tags = String(input).match(this.regex.tags);

		if(this.config.newline) {
			if(this.config.paragraph) {
				input = input.replace(this.regex.newline, '</p><p>');
			}else{
				input = input.replace(this.regex.newline, '<br/>');
			}
		}
		if(this.config.paragraph) {
			input = '<p>' + input + '</p>';
		}

		// handle when no tags are present
		if(!tags || tags.length === 0) {
			return input;
		}
		for(const [i, tag] of tags.entries()) {
			const parts = tag.slice(1, -1).split('=');
			const item = {
				index: i,
				module: parts[0].toLowerCase(),
				isClosing: tag.slice(1, 2) === '/',
				raw: tag,
				attr: parts.slice(1).join('='),
				closing: null,
				children: [],
				parent: null,
				matchTag: null,
			};
			if(item.isClosing) {
				item.module = item.module.slice(1);
			}

			tagsMap.push(item);
			input = input.replace(tag, '[TAG-' + i + ']'); // placeholder for tag
		}
		// loop through each tag to create nested elements
		tagsMap = this.#tagLoop(tagsMap);
		// put back all non-found matches?
		input = this.#contentLoop(tagsMap, input);
		if(this.config.cleanUnmatchable) {
			input = input.replace(this.regex.placeholders, '');
		}
		return input;
	}
}

module.exports = yabbcode;
