#! /usr/bin/env node

// NPM ecosystem includes
const parseArgs = require("minimist")
const path = require("path")
const fs = require("fs")
const os = require("os")
const lodash = require("lodash")
const dayjs = require("dayjs")
const open = require("open")

// Tree Notation Includes
const { jtree } = require("jtree")
const { TreeNode } = jtree
const { Disk } = require("jtree/products/Disk.node.js")
const grammarNode = require("jtree/products/grammar.nodejs.js")
const stump = require("jtree/products/stump.nodejs.js")
const hakon = require("jtree/products/hakon.nodejs.js")
const packageJson = require("./package.json")

// Helper utils
const read = fullFilePath => fs.readFileSync(fullFilePath, "utf8").replace(/\r/g, "") // Note: This also removes \r. There's never a reason to use \r.
const write = (fullFilePath, content) => fs.writeFileSync(fullFilePath, content, "utf8")
const removeReturnCharsAndRightShift = (str, numSpaces) => str.replace(/\r/g, "").replace(/\n/g, "\n" + " ".repeat(numSpaces))
const unsafeStripHtml = html => html.replace(/<[^>]*>?/gm, "")
// Normalize 3 possible inputs: 1) cwd of the process 2) provided absolute path 3) cwd of process + provided relative path
const resolvePath = (folder = "") => (path.isAbsolute(folder) ? path.normalize(folder) : path.resolve(path.join(process.cwd(), folder)))
const isAbsoluteUrl = url => url.startsWith("https://") || url.startsWith("http://")

const nextAndPrevious = (arr, item) => {
	const len = arr.length
	const current = arr.indexOf(item)
	return {
		previous: arr[(current + len - 1) % len],
		next: arr[(current + 1) % len]
	}
}

const recursiveReaddirSync = (folder, callback) =>
	fs.readdirSync(folder).forEach(file => {
		try {
			const fullPath = path.join(folder, file)
			const isDir = fs.lstatSync(fullPath).isDirectory()
			if (isDir) recursiveReaddirSync(fullPath, callback)
			else callback(fullPath)
		} catch (err) {
			// Ignore errors
		}
	})

// Constants
const SCROLL_SRC_FOLDER = __dirname
const SCROLL_VERSION = packageJson.version
const SCROLL_FILE_EXTENSION = ".scroll"
const GRAMMAR_EXTENSION = ".grammar"
const grammarDefinitionRegex = /[a-zA-Z0-9_]+Node/

const readFileCache = {}
const readFileWithCache = path => {
	if (!readFileCache[path]) readFileCache[path] = Disk.read(path)
	return readFileCache[path]
}

const expandedImportCache = {}
// A regex to check if a multiline string has a line that starts with "import ".
const importRegex = /^import /gm
const getFullyExpandedFile = absoluteFilePath => {
	if (expandedImportCache[absoluteFilePath]) return expandedImportCache[absoluteFilePath]
	const code = readFileWithCache(absoluteFilePath)

	if (!code.match(importRegex))
		return {
			code,
			importFilePaths: []
		}

	let importFilePaths = []
	const lines = code.split("\n")
	const replacements = []
	lines.forEach((line, index) => {
		const folder = path.dirname(absoluteFilePath)
		if (line.match(importRegex)) {
			const absoluteImportFilePath = path.join(folder, line.replace("import ", ""))
			const expandedFile = getFullyExpandedFile(absoluteImportFilePath)
			replacements.push([index, expandedFile.code])
			importFilePaths.push(absoluteImportFilePath)
			importFilePaths = importFilePaths.concat(expandedFile.importFilePaths)
		}
	})

	replacements.forEach(replacement => {
		const [lineNumber, text] = replacement
		lines[lineNumber] = text
	})

	expandedImportCache[absoluteFilePath] = {
		code: lines.join("\n"),
		importFilePaths
	}
	return expandedImportCache[absoluteFilePath]
}

const getOneGrammarFromFiles = filePaths => {
	const asOneFile = filePaths
		.map(filePath => {
			const content = readFileWithCache(filePath)
			if (filePath.endsWith(GRAMMAR_EXTENSION)) return content
			// Strip scroll content
			return new TreeNode(content)
				.filter(node => node.getLine().match(grammarDefinitionRegex))
				.map(node => node.toString())
				.join("\n")
		})
		.join("\n")
		.trim()

	// todo: clean up jtree so we are using supported methods (perhaps add a formatOptions that allows you to tell Grammar not to run prettier on js nodes)
	return new grammarNode(asOneFile)
		._sortNodesByInScopeOrder()
		._sortWithParentNodeTypesUpTop()
		.toString()
}
// Default compiler
const DefaultGrammarFiles = Disk.getFiles(path.join(__dirname, "grammar")).filter(file => file.endsWith(GRAMMAR_EXTENSION))
const compilerCache = {}
const getCompiler = filePaths => {
	const key = filePaths
		.filter(fp => fp)
		.sort()
		.join("\n")
	const hit = compilerCache[key]
	if (hit) return hit
	const grammarCode = getOneGrammarFromFiles(filePaths)
	const compiler = new jtree.HandGrammarProgram(grammarCode).compileAndReturnRootConstructor()
	compilerCache[key] = {
		grammarCode,
		compiler
	}
	return compilerCache[key]
}
const DefaultScrollCompiler = getCompiler(DefaultGrammarFiles).compiler

// This is all the CSS
const SCROLL_HAKON_FILENAME = "scroll.hakon"
const SCROLL_CSS = new hakon(read(path.join(SCROLL_SRC_FOLDER, SCROLL_HAKON_FILENAME))).compile()
const DEFAULT_COLUMN_WIDTH = 35
const COLUMN_GAP = 20

const CommandFnDecoratorSuffix = "Command"
const scrollBoilerplateCompiledMessage = `<!doctype html>
<!--

 This page was compiled by 📜 Scroll, a public domain
 programming language and static site publishing tool.
 
 https://scroll.pub
 
 Generally you don't want to edit it by hand.

 Scroll v${SCROLL_VERSION}

-->`

const cssClasses = {
	scrollGroupPageComponent: "scrollGroupPageComponent",
	scrollGroupPageFileContainerComponent: "scrollGroupPageFileContainerComponent",
	scrollFileViewSourceUrlComponent: "scrollFileViewSourceUrlComponent",
	scrollFilePageComponent: "scrollFilePageComponent",
	scrollFilePageTitle: "scrollFilePageTitle"
}

// Todo: how to keep in sync with grammar?
const scrollKeywords = {
	title: "title",
	htmlTitle: "htmlTitle",
	viewSourceUrl: "viewSourceUrl",
	permalink: "permalink",
	paragraph: "paragraph",
	aftertext: "aftertext",
	image: "image",
	date: "date",
	endSnippet: "endSnippet",
	groups: "groups",
	replace: "replace",
	replaceDefault: "replaceDefault",
	import: "import",
	importOnly: "importOnly",
	siteTitle: "siteTitle",
	siteDescription: "siteDescription",
	baseUrl: "baseUrl",
	viewSourceBaseUrl: "viewSourceBaseUrl",
	openGraphImage: "openGraphImage",
	maxColumns: "maxColumns",
	columnWidth: "columnWidth",
	twitter: "twitter",
	github: "github",
	email: "email",
	rssFeedUrl: "rssFeedUrl",
	scrollHeader: "scrollHeader",
	scrollFooter: "scrollFooter",
	scrollCss: "scrollCss"
}

const initSite = {
	firstPost: `${scrollKeywords.title} Hello world
${scrollKeywords.date} ${dayjs().format(`MM-DD-YYYY`)}

${scrollKeywords.paragraph}
 This is my first blog post using Scroll. This post will appear in the feed and on the index page.
groups index
import settings.scroll`,
	settings: `importOnly
siteTitle My Website
siteDescription Powered by Scroll
github https://github.com/breck7/scroll
viewSourceBaseUrl https://github.com/breck7/scroll/blob/main
twitter https://twitter.com/breckyunits
email feedback@scroll.pub
rssFeedUrl feed.xml
baseUrl https://scroll.pub/`,
	about: `import settings.scroll
title About this site

paragraph
 This is a static page.`,
	feed: `import settings.scroll
permalink feed.xml
template blank
printFeed index`,
	index: `import settings.scroll
template group index`
}

const SCROLL_ICONS = {
	githubSvg: `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>GitHub icon</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
	twitterSvg: `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Twitter icon</title><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>`,
	emailSvg: `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Gmail icon</title><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>`
}

const evalVariables = code => {
	const codeAsTree = new TreeNode(code)
	// Process variables
	const varMap = {}
	codeAsTree
		.filter(node => {
			const keyword = node.getWord(0)
			return keyword === "replace" || keyword === "replaceDefault"
		})
		.forEach(node => {
			varMap[node.getWord(1)] = node.length ? node.childrenToString() : node.getWordsFrom(2).join(" ")
		})

	const keys = Object.keys(varMap)
	if (!keys.length) return code

	let codeAfterVariableSubstitution = code
	// Todo: speed up. build a template?
	Object.keys(varMap).forEach(key => (codeAfterVariableSubstitution = codeAfterVariableSubstitution.replace(new RegExp(key, "g"), varMap[key])))

	return codeAfterVariableSubstitution
}

const _grammarExpandersCache = {}
const doesFileHaveGrammarDefinitions = absoluteFilePath => {
	if (!absoluteFilePath) return false
	if (_grammarExpandersCache[absoluteFilePath] === undefined) _grammarExpandersCache[absoluteFilePath] = !!readFileWithCache(absoluteFilePath).match(/^[a-zA-Z0-9_]+Node/gm)

	return _grammarExpandersCache[absoluteFilePath]
}

const _treeCache = {}
const getFileAsTree = absoluteFilePath => {
	if (_treeCache[absoluteFilePath] === undefined) {
		_treeCache[absoluteFilePath] = new TreeNode(read(absoluteFilePath))
	}
	return _treeCache[absoluteFilePath]
}

class ScrollFile {
	constructor(originalScrollCode = "", folder = new ScrollFolder(), absoluteFilePath = "") {
		this.folder = folder
		this.filePath = absoluteFilePath
		this.filename = path.basename(this.filePath)
		this.SCROLL_CSS = SCROLL_CSS // todo: cleanup

		let afterImportPass = originalScrollCode
		let filepathsWithGrammarDefinitions = []
		if (absoluteFilePath) {
			// Do not build a file marked 'importOnly'
			this.shouldBuild = !getFileAsTree(absoluteFilePath).has(scrollKeywords.importOnly)
			const expandedFile = getFullyExpandedFile(absoluteFilePath)
			filepathsWithGrammarDefinitions = expandedFile.importFilePaths.filter(doesFileHaveGrammarDefinitions)
			if (doesFileHaveGrammarDefinitions(absoluteFilePath)) filepathsWithGrammarDefinitions.push(absoluteFilePath)
			afterImportPass = expandedFile.code
		}

		const afterVariablePass = evalVariables(afterImportPass)

		// Compile with STD LIB or custom compiler if there are grammar defs defined
		const compiler = filepathsWithGrammarDefinitions.length === 0 ? DefaultScrollCompiler : getCompiler(DefaultGrammarFiles.concat(filepathsWithGrammarDefinitions)).compiler
		this.scrollScriptProgram = new compiler(afterVariablePass)

		this.scrollFilesWithGrammarNodeDefinitions = filepathsWithGrammarDefinitions
		this.scrollScriptProgram.setFile(this)
		this.timestamp = dayjs(this.scrollScriptProgram.get(scrollKeywords.date) ?? 0).unix()
		this.permalink = this.scrollScriptProgram.get(scrollKeywords.permalink) || this.filename.replace(SCROLL_FILE_EXTENSION, "") + ".html"
	}

	shouldBuild = true
	filePath = ""

	get template() {
		const templates = {
			group: GroupTemplate,
			snippets: SnippetsGroupTemplate,
			blank: BlankTemplate,
			file: FileTemplate
		}
		const templateName = this.scrollScriptProgram.getNode("template")?.getWord(1)
		return templates[templateName] || FileTemplate
	}

	get html() {
		const { template } = this
		return new template(this).toHtml()
	}

	get primaryGroup() {
		return this.folder.getGroup(this.groups[0])
	}

	get keyboardNavGroup() {
		return this.primaryGroup.filter(file => file.shouldBuild)
	}

	get linkToPrevious() {
		return nextAndPrevious(this.keyboardNavGroup, this).previous.permalink
	}

	get linkToNext() {
		return nextAndPrevious(this.keyboardNavGroup, this).next.permalink
	}

	save() {
		write(`${this.filePath}`, this.scrollScriptProgram.toString())
	}

	// todo: add an openGraph node type to define this stuff manually
	get openGraphImage() {
		const openGraphImage = this.get(scrollKeywords.openGraphImage)
		if (openGraphImage !== undefined) return openGraphImage

		const node = this.scrollScriptProgram.getNode(scrollKeywords.image)
		if (!node) return ""

		const link = node.getContent()
		return isAbsoluteUrl(link) ? link : this.baseUrl + "/" + link
	}

	// todo: add an openGraph node type to define this stuff manually
	// Use the first paragraph for the description
	// todo: add a tree method version of get that gets you the first node. (actulaly make get return array?)
	// would speed up a lot.
	get openGraphDescription() {
		const program = this.scrollScriptProgram
		for (let node of program.getTopDownArrayIterator()) {
			const word = node.getWord(0)
			if (word === scrollKeywords.paragraph || word === scrollKeywords.aftertext)
				return unsafeStripHtml(node.compile())
					.replace(/\n/g, " ")
					.substr(0, 300)
		}
		return ""
	}

	get groups() {
		return (this.scrollScriptProgram.get(scrollKeywords.groups) || "").split(" ")
	}

	get title() {
		return this.scrollScriptProgram.get(scrollKeywords.title) ?? ""
	}

	get htmlTitle() {
		return this.scrollScriptProgram.get(scrollKeywords.htmlTitle)
	}

	get(keyword) {
		return this.scrollScriptProgram.get(keyword)
	}

	get siteTitle() {
		return this.get(scrollKeywords.siteTitle)
	}

	get siteDescription() {
		return this.get(scrollKeywords.siteDescription)
	}

	get viewSourceUrl() {
		const viewSourceUrl = this.get(scrollKeywords.viewSourceUrl)
		const viewSourceBaseUrl = this.get(scrollKeywords.viewSourceBaseUrl)
		return viewSourceUrl || (viewSourceBaseUrl ? viewSourceBaseUrl.replace(/\/$/, "") + "/" + path.basename(this.filePath) : "")
	}

	_compiled = ""
	get compiled() {
		if (!this._compiled) this._compiled = this.scrollScriptProgram.compile()
		return this._compiled
	}

	get htmlCode() {
		return this.compiled + (this.viewSourceUrl ? `<p class="${cssClasses.scrollFileViewSourceUrlComponent}"><a href="${this.viewSourceUrl}">View source</a></p>` : "")
	}

	get htmlCodeForSnippetsPage() {
		const { snippetBreakNode } = this
		if (!snippetBreakNode) return this.htmlCode

		const program = this.scrollScriptProgram
		const indexOfBreak = snippetBreakNode.getIndex()
		return (
			program
				.map((child, index) => (index >= indexOfBreak ? "" : child.compile()))
				.filter(i => i)
				.join(program._getChildJoinCharacter()) + `<a class="scrollContinueReadingLink" href="${this.permalink}">Continue reading...</a>`
		)
	}

	get snippetBreakNode() {
		return this.scrollScriptProgram.getNode(scrollKeywords.endSnippet)
	}

	// todo: rename publishedUrl? Or something to indicate that this is only for stuff on the web (not localhost)
	// BaseUrl must be provided for RSS Feeds and OpenGraph tags to work
	get baseUrl() {
		return this.scrollScriptProgram.get(scrollKeywords.baseUrl) ?? ""
	}

	toRss() {
		const { title, permalink, baseUrl } = this
		return ` <item>
  <title>${title}</title>
  <link>${baseUrl + permalink}</link>
 </item>`
	}
}

class AbstractTemplate {
	constructor(file) {
		this.file = file
	}

	get folder() {
		return this.file.folder
	}

	get htmlTitle() {
		return this.siteTitle
	}

	get siteTitle() {
		return this.file.siteTitle
	}

	get siteDescription() {
		return this.file.siteDescription
	}

	get github() {
		return this.file.get(scrollKeywords.github)
	}

	get email() {
		return this.file.get(scrollKeywords.email)
	}

	get twitter() {
		return this.file.get(scrollKeywords.twitter)
	}

	get header() {
		const header = this.file.scrollScriptProgram.getNode(scrollKeywords.scrollHeader)
		if (header) return header.childrenToString()

		return `div
 class scrollHeaderComponent
 div
  class scrollTopRightBarComponent
  div
   class scrollSocialMediaIconsComponent
   a ${SCROLL_ICONS.githubSvg}
    href ${this.github}
 h2
  class scrollNameComponent
  a ${this.siteTitle}
   href index.html
 div ${this.siteDescription}`
	}

	get footer() {
		const footer = this.file.scrollScriptProgram.getNode(scrollKeywords.scrollFooter)
		if (footer) return footer.childrenToString()
		return `div
 class scrollFooterComponent
 div
  class scrollSocialMediaIconsComponent
  a ${SCROLL_ICONS.emailSvg}
   href mailto:${this.email}
  a ${SCROLL_ICONS.twitterSvg}
   href ${this.twitter}
  a ${SCROLL_ICONS.githubSvg}
   href ${this.github}
 a Built with Scroll v${SCROLL_VERSION}
  href https://scroll.pub
  class scrollCommunityLinkComponent`
	}

	get columnWidth() {
		return this.file.get(scrollKeywords.columnWidth) ?? DEFAULT_COLUMN_WIDTH
	}

	get maxColumns() {
		// If undefined will be autocomputed
		return this.file.get(scrollKeywords.maxColumns)
	}

	// Todo: scroll.css link thing fix.
	get styleCode() {
		// Default is to inline CSS. Otherwise we can split it into a sep file.
		const cssFile = this.file.get(scrollKeywords.scrollCss)

		if (cssFile === "") return ""

		if (cssFile)
			return `link
   rel stylesheet
   type text/css
   href ${cssFile}`

		return `styleTag
   bern
    ${removeReturnCharsAndRightShift(SCROLL_CSS, 4)}`
	}

	get rssTag() {
		const rssFeedUrl = this.file.get(scrollKeywords.rssFeedUrl)
		if (!rssFeedUrl) return ""
		return `link
 rel alternate
 type application/rss+xml
 title ${this.siteTitle}
 href ${rssFeedUrl}`
	}

	get stumpCode() {
		return `html
 lang en-US
 head
  meta
   charset utf-8
  titleTag ${this.htmlTitle}
  meta
   name viewport
   content width=device-width,initial-scale=1
  meta
   name description
   content ${this.siteDescription}
  meta
   name generator
   content Scroll v${SCROLL_VERSION}
  meta
   property og:title
   content ${this.openGraphTitle}
  meta
   property og:description
   content ${this.openGraphDescription}
  meta
   property og:image
   content ${this.file.openGraphImage}
  ${removeReturnCharsAndRightShift(this.rssTag, 2)}
  meta
   name twitter:card
   content summary_large_image
  ${this.styleCode}
 body
  ${removeReturnCharsAndRightShift(this.header, 2)}
  ${removeReturnCharsAndRightShift(this.pageCode, 2)}
  ${removeReturnCharsAndRightShift(this.footer, 2)}`
	}

	toHtml() {
		return scrollBoilerplateCompiledMessage + "\n" + new stump(this.stumpCode).compile()
	}
}

class BlankTemplate extends AbstractTemplate {
	toHtml() {
		return this.file.compiled.trim()
	}
}

class FileTemplate extends AbstractTemplate {
	get openGraphTitle() {
		return this.file.title
	}

	get openGraphDescription() {
		return this.file.openGraphDescription
	}

	get htmlTitle() {
		const { htmlTitle } = this.file
		if (htmlTitle) return htmlTitle

		const { title } = this.file
		return (title ? `${title} - ` : "") + this.siteTitle
	}

	get pageCode() {
		const { file, openGraphTitle, cssColumnWorkaround } = this
		return `h1
 class ${cssClasses.scrollFilePageTitle}
 a ${openGraphTitle}
  href ${file.permalink}
div
 class ${cssClasses.scrollFilePageComponent}
 style ${cssColumnWorkaround}
 bern
  ${removeReturnCharsAndRightShift(file.htmlCode, 2)}`
	}

	get estimatedLines() {
		return lodash.sum(this.file.scrollScriptProgram.map(node => (node.getLine() === "" ? 0 : node.getTopDownArray().length)))
	}

	get cssColumnWorkaround() {
		let { maxColumns, columnWidth } = this
		if (!maxColumns) {
			const { estimatedLines } = this
			if (estimatedLines > 20) return ""
			maxColumns = estimatedLines > 10 ? 2 : 1
		}
		const maxTotalWidth = maxColumns * columnWidth + (maxColumns - 1) * COLUMN_GAP
		return `column-width:${columnWidth}ch;column-count:${maxColumns};max-width:${maxTotalWidth}ch;`
	}
}

class GroupTemplate extends AbstractTemplate {
	get openGraphTitle() {
		return this.siteTitle
	}

	get openGraphDescription() {
		return this.siteDescription
	}

	get groupName() {
		return this.file.scrollScriptProgram.getNode("template").getWord(2)
	}

	get files() {
		return this.folder.getGroup(this.groupName)
	}

	get pageCode() {
		const { property, files } = this
		const fileCode = files
			.map(file => {
				const node = new TreeNode(`div
 class ${cssClasses.scrollGroupPageFileContainerComponent}`)
				node.getNode("div").appendLineAndChildren("bern", file[property])
				return node.toString()
			})
			.join("\n")

		return `div
 class ${cssClasses.scrollGroupPageComponent}
 style column-width:${this.columnWidth}ch;
 ${removeReturnCharsAndRightShift(fileCode, 1)}`
	}

	property = "htmlCode"
}

class SnippetsGroupTemplate extends GroupTemplate {
	property = "htmlCodeForSnippetsPage"
}

class ScrollFolder {
	constructor(folder = __dirname) {
		this.folder = path.normalize(folder)
	}

	getGroup(groupName) {
		return this.files.filter(file => file.groups.includes(groupName))
	}

	get grammarErrors() {
		this._initFiles() // Init all compilers
		return Object.values(compilerCache)
			.map(compiler => new grammarNode(compiler.grammarCode).getAllErrors().map(err => err.toObject()))
			.flat()
	}

	get fullScrollFilePaths() {
		return Disk.getFiles(this.folder).filter(file => file.endsWith(SCROLL_FILE_EXTENSION))
	}

	_initFiles() {
		if (this._files) return
		const all = this.fullScrollFilePaths.map(fullFilePath => new ScrollFile(readFileWithCache(fullFilePath), this, fullFilePath))
		this._files = lodash.sortBy(all, file => file.timestamp).reverse()
	}

	_files
	get files() {
		if (this._files) return this._files
		this._initFiles()
		return this._files
	}

	get errors() {
		return this.files
			.map(file =>
				file.scrollScriptProgram.getAllErrors().map(err => {
					return { filename: file.filename, ...err.toObject() }
				})
			)
			.flat()
	}

	_migrate27() {
		let changed = false
		console.log(`🚚 Applying 27.0.0 migrations`)
		this.files.forEach(file => {
			const code = file.scrollScriptProgram
			const original = code.toString()
			const permalink = code.get("permalink")
			if (permalink) {
				code.set("permalink", permalink.replace(".html", "") + ".html")
				file.save()
				if (original !== code.toString()) changed = true
			}
		})
		return changed
	}

	migrate() {
		if (this._migrate27()) {
			console.log(`Migration step resulted in changes. Run migrate again to run more migrations.`)
			return
		}

		const replaceEmojiLinksWithAftertextLinks = node => {
			// todo: a better place for these util functions? I stick them in here so the
			// grammar is all in one file for ease of use in TreeLanguageDesigner
			const linksToAdd = []
			const linkReplacer = (match, p1, p2, p3, offset, str) => {
				let suffix = ""
				if (p3.endsWith(",")) suffix = "," + suffix
				if (p3.endsWith(".")) suffix = "." + suffix
				p3 = p3.replace(/(,|\.)$/, "")
				let prefix = "https://"
				const isRelativeLink = p3.startsWith("./")
				if (isRelativeLink) {
					prefix = ""
					p3 = p3.substr(2)
				}
				if (isAbsoluteUrl(p3)) prefix = ""
				const linkText = p2
				const fullLink = `${prefix}${p3}`
				linksToAdd.push([fullLink, linkText])
				return `${p1}${linkText}${suffix}`
			}
			return [node.childrenToString().replace(/(^|\s)(\S+)🔗(\S+)(?=(\s|$))/g, linkReplacer), linksToAdd]
		}

		const updateParagraph = node => {
			const results = replaceEmojiLinksWithAftertextLinks(node)
			node.setChildren(results[0])
			results[1].forEach(link => {
				node.appendLine(`link ${link[0]} ${link[1]}`)
			})
			node.setWord(0, "aftertext")
		}

		// Files that have a date, a paragraph, and no dateline added yet need one
		console.log(`🚚 Applying 24.0.0 migrations`)
		this.files.forEach(file => {
			const content = file.scrollScriptProgram
			const ps = content.findNodes("paragraph")
			if (content.has("date") && content.has("paragraph") && content.findNodes("aftertext dateline").length === 0) {
				const firstParagraph = ps.shift()
				updateParagraph(firstParagraph)
				firstParagraph.appendLine("dateline")
			}
			ps.forEach(updateParagraph)
			file.save()
		})

		return this
	}

	silence() {
		this.verbose = false
		return this
	}

	verbose = true
	folder = ""

	logIndent = 0
	log(message) {
		const indent = "    ".repeat(this.logIndent)
		if (this.verbose) console.log(indent + message)
		return message
	}

	buildFiles() {
		return this._buildAndWriteFiles()
	}

	_buildAndWriteFiles() {
		const start = Date.now()
		const { files, folder } = this
		const filesToBuild = files.filter(file => file.shouldBuild)
		this.log(`Building ${filesToBuild.length} files from ${files.length} ${SCROLL_FILE_EXTENSION} files found in '${folder}'\n`)
		this.logIndent++
		const pages = filesToBuild.map(file => {
			const { permalink, html } = file
			this.write(permalink, html, `Wrote ${file.filename} to ${permalink}`)
			return { permalink, html }
		})
		const seconds = (Date.now() - start) / 1000
		this.logIndent--
		this.log(``)
		this.log(`⌛️ Compiled ${pages.length} files to html in ${seconds} seconds. ${lodash.round(pages.length / seconds)} pages per second\n`)

		return pages
	}

	write(filename, content, message) {
		const result = write(path.join(this.folder, filename), content)
		this.log(`💾 ` + message)
		return result
	}

	buildAll() {
		this.log(`\n👷 building folder '${this.folder}'\n`)
		this.logIndent++
		this.buildFiles()
		this.logIndent--
	}
}

class ScrollCli {
	execute(args = []) {
		this.log(`\n📜📜📜 WELCOME TO SCROLL (v${SCROLL_VERSION}) 📜📜📜`)
		const command = args[0] // Note: we don't take any parameters on purpose. Simpler UX.
		const commandName = `${command}${CommandFnDecoratorSuffix}`
		const cwd = process.cwd()
		if (this[commandName]) return this[commandName](cwd)
		else if (command) this.log(`No command '${command}'. Running help command.`)
		else this.log(`No command provided. Running help command.`)
		return this.helpCommand()
	}

	verbose = true
	log(message) {
		if (this.verbose) console.log(message)
		return message
	}

	get _allCommands() {
		return Object.getOwnPropertyNames(Object.getPrototypeOf(this))
			.filter(word => word.endsWith(CommandFnDecoratorSuffix))
			.sort()
	}

	async initCommand(cwd) {
		const folder = new ScrollFolder()
		this.log(`Initializing scroll in "${cwd}"`)

		Object.keys(initSite).forEach(filename => {
			const filePath = path.join(cwd, filename + SCROLL_FILE_EXTENSION)
			if (!fs.existsSync(filePath)) write(filePath, initSite[filename])
		})

		return this.log(`\n👍 Initialized new scroll in '${cwd}'. Build your new site with: scroll build`)
	}

	deleteCommand() {
		return this.log(`\n💡 To delete a Scroll just delete the folder\n`)
	}

	checkCommand(cwd) {
		const folder = new ScrollFolder(resolvePath(cwd))
		const { grammarErrors } = folder
		const grammarMessage = grammarErrors.length ? new jtree.TreeNode(grammarErrors).toFormattedTable(200) + "\n" : ""
		if (grammarMessage) this.log(grammarMessage)
		const scrollErrors = folder.errors
		const message = scrollErrors.length ? new jtree.TreeNode(scrollErrors).toFormattedTable(60) : "0 errors"
		return this.log(message)
	}

	async buildCommand(cwd) {
		const folder = new ScrollFolder(resolvePath(cwd))
		folder.verbose = this.verbose
		folder.buildAll()
		return folder
	}

	async migrateCommand(cwd) {
		const folder = new ScrollFolder(resolvePath(cwd))
		folder.verbose = this.verbose
		folder.migrate()
		return folder
	}

	async watchCommand(cwd) {
		const folderOrErrorMessage = await this.buildCommand(cwd)
		if (typeof folderOrErrorMessage === "string") return folderOrErrorMessage
		const { folder } = folderOrErrorMessage

		this.log(`\n🔭 Watching for changes in 📁 ${folder}`)

		this._watcher = fs.watch(folder, (event, filename) => {
			const fullFilePath = path.join(folder, filename)
			if (!fullFilePath.endsWith(SCROLL_FILE_EXTENSION)) return
			this.log(`\n✅ "${fullFilePath}" changed.`)

			if (!Disk.exists(fullFilePath)) {
				// file deleted
			} else if (false) {
				// new file
			} else {
				// file updates
			}
			const newFolder = new ScrollFolder(folder)
			newFolder.verbose = folder.verbose
			newFolder.buildAll()
		})

		if (this.verbose) await open(`file://${folder}/index.html`)
		return this
	}

	_watcher = undefined

	stopWatchingForFileChanges() {
		this._watcher.close()
		this._watcher = undefined
	}

	whereCommand() {
		return this.findScrollsInDirRecursive(os.homedir())
	}

	findScrollsInDirRecursive(dir) {
		const folders = {}

		this.log(`\n🔭 Scanning '${dir}' for folders with ${SCROLL_FILE_EXTENSION} files.`)
		recursiveReaddirSync(dir, filename => {
			if (!filename.endsWith(SCROLL_FILE_EXTENSION)) return

			const folder = path.dirname(filename)
			if (!folders[folder]) {
				folders[folder] = {
					folder,
					count: 0
				}
				this.log(`Found ${SCROLL_FILE_EXTENSION} file(s) in ${folder}`)
			}
			folders[folder].count++
		})

		const sorted = lodash.sortBy(folders, "count").reverse()
		const table = new jtree.TreeNode(sorted).toFormattedTable(120)

		return this.log(`\n🔭 Found the following folders in '${dir}' containing ${SCROLL_FILE_EXTENSION} files:\n${table}`)
	}

	helpCommand() {
		return this.log(`\nThis is the Scroll help page.\n\nCommands you can run from your Scroll's folder:\n\n${this._allCommands.map(comm => `🖌️ ` + comm.replace(CommandFnDecoratorSuffix, "")).join("\n")}\n​​`)
	}
}

if (module && !module.parent) new ScrollCli().execute(parseArgs(process.argv.slice(2))._)

module.exports = { ScrollFile, ScrollFolder, ScrollCli, scrollKeywords, DefaultScrollCompiler, SCROLL_CSS, getFullyExpandedFile }
