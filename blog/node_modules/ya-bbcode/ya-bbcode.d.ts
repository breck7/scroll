export = yabbcode

declare class yabbcode {
	/**
	 * Create a new bbcode parser
	 */
	constructor(config?: {
		newline?: boolean
		paragraph?: boolean
		cleanUnmatchable?: boolean
		sanitizeHtml?: boolean
	})
	/**
	 * Parse bbcode
	 * @param bbc bbcode to parse
	 */
	parse(bbc: any): string
	/**
	 * Remove all default or registered tags
	 */
	clearTags(): this
	/**
	 * Add custom tags
	 * @param tag tag name
	 * @param options options to parse the tag
	 */
	registerTag(tag: string, options: {
		type: 'replace'
		open: ((attr: string) => string) | string
		close: ((attr: string) => string) | string | null
	}): this
	registerTag(tag: string, options: {
		type: 'content',
		replace: (attr: string, content: string) => string
	}): this
	registerTag(tag: string, options: {
		type: 'ignore'
	}): this
}