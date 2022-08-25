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
const { TreeNode, Utils } = jtree
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
const SCROLL_SETTINGS_FILENAME = "settings.scroll"
const GRAMMAR_EXTENSION = ".grammar"

const getGrammarConstructorFromFiles = files => {
	const asOneFile = files.map(Disk.read).join("\n")
	const formatted = new grammarNode(asOneFile).format().toString()
	return new jtree.HandGrammarProgram(formatted).compileAndReturnRootConstructor()
}
// Default compiler
const DefaultGrammarFiles = Disk.getFiles(path.join(__dirname, "grammar")).filter(file => file.endsWith(GRAMMAR_EXTENSION))
const compilerCache = new Map()
const getCompiler = filePaths => {
	const key = filePaths.join("\n")
	const hit = compilerCache.get(key)
	if (hit) return hit
	const compiler = getGrammarConstructorFromFiles(filePaths)
	compilerCache.set(key, compiler)
	return compiler
}
const DefaultScrollScriptCompiler = getCompiler(DefaultGrammarFiles)

// This is all the CSS
const SCROLL_HAKON_FILENAME = "scroll.hakon"
const SCROLL_CSS = new hakon(read(path.join(SCROLL_SRC_FOLDER, SCROLL_HAKON_FILENAME))).compile()
const DEFAULT_COLUMN_WIDTH = 35
const COLUMN_GAP = 20

const CommandFnDecoratorSuffix = "Command"
const scrollBoilerplateCompiledMessage = `<!doctype html>
<!--

 This page was compiled by 📜 Scroll, the public domain
 static site publishing software.
 
 https://scroll.pub
 
 Generally you don't want to edit it by hand.

 Scroll v${SCROLL_VERSION}

-->`

const cssClasses = {
	scrollGroupPageComponent: "scrollGroupPageComponent",
	scrollGroupPageFileContainerComponent: "scrollGroupPageFileContainerComponent",
	scrollFileSourceLinkComponent: "scrollFileSourceLinkComponent",
	scrollFilePageComponent: "scrollFilePageComponent",
	scrollFilePageTitle: "scrollFilePageTitle"
}

const scrollKeywords = {
	title: "title",
	htmlTitle: "htmlTitle",
	sourceLink: "sourceLink",
	permalink: "permalink",
	paragraph: "paragraph",
	aftertext: "aftertext",
	image: "image",
	date: "date",
	endSnippet: "endSnippet",
	groups: "groups",
	import: "import",
	importOnly: "importOnly",
	settings: "settings"
}

// Todo: how to keep in sync with grammar?
const settingsKeywords = {
	title: "title",
	description: "description",
	git: "git",
	baseUrl: "baseUrl",
	maxColumns: "maxColumns",
	columnWidth: "columnWidth",
	twitter: "twitter",
	github: "github",
	email: "email",
	rssFeedUrl: "rssFeedUrl",
	importFrom: "importFrom",
	header: "header",
	footer: "footer",
	css: "css" // "none" or "inline". Defaults to "inline"
}

const initReadmePage = `${scrollKeywords.title} Hello world
${scrollKeywords.date} ${dayjs().format(`MM-DD-YYYY`)}

${scrollKeywords.paragraph}
 This is my new Scroll.`

const doesFolderHaveASettingsDotScrollFile = absPath => fs.existsSync(path.normalize(path.join(absPath, SCROLL_SETTINGS_FILENAME)))

const SCROLL_ICONS = {
	githubSvg: `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>GitHub icon</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
	twitterSvg: `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Twitter icon</title><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>`,
	emailSvg: `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Gmail icon</title><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>`
}

class ScrollFile {
	constructor(scrollScriptProgram, filePath, sourceLink, folder) {
		this.scrollScriptProgram = scrollScriptProgram
		this._sourceLink = sourceLink
		this.filePath = filePath
		this.filename = path.basename(filePath)
		this.folder = folder
		this.baseUrl = folder.settings.baseUrl
		scrollScriptProgram.setFile(this)
		scrollScriptProgram.setFolder(path.dirname(filePath))
		this.SCROLL_CSS = SCROLL_CSS // todo: cleanup
	}

	// Do not build a file marked 'importOnly'
	get shouldBuild() {
		return !this.scrollScriptProgram.has(scrollKeywords.importOnly)
	}

	get template() {
		const templates = {
			group: GroupTemplate,
			snippets: SnippetsGroupTemplate,
			none: NoTemplate,
			file: FileTemplate
		}
		return templates[this.scrollScriptProgram.get("template")] || FileTemplate
	}

	get html() {
		const { template } = this
		return new template(this).toHtml()
	}

	get primaryGroup() {
		return this.folder.getGroup(this.groups[0])
	}

	get linkToPrevious() {
		return nextAndPrevious(this.primaryGroup, this).previous.permalink
	}

	get linkToNext() {
		return nextAndPrevious(this.primaryGroup, this).next.permalink
	}

	save() {
		write(`${this.filePath}`, this.scrollScriptProgram.toString())
	}

	_sourceLink = ""
	filename = ""
	filePath = ""
	baseUrl = ""

	get permalink() {
		return this.scrollScriptProgram.get(scrollKeywords.permalink) || this.filename.replace(SCROLL_FILE_EXTENSION, "") + ".html"
	}

	get ogImage() {
		const index = this.scrollScriptProgram.indexOf(scrollKeywords.image)
		return index > -1 ? this.scrollScriptProgram.nodeAt(index).getContent() : ""
	}

	// Use the first paragraph for the description
	get ogDescription() {
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

	get sourceLink() {
		return this.scrollScriptProgram.get(scrollKeywords.sourceLink) || this._sourceLink
	}

	get timestamp() {
		return dayjs(this.scrollScriptProgram.get(scrollKeywords.date) ?? 0).unix()
	}

	get settingsNode() {
		return this.scrollScriptProgram.getNode(scrollKeywords.settings) || new TreeNode()
	}

	get maxColumns() {
		return this.settingsNode.get(settingsKeywords.maxColumns)
	}

	get columnWidth() {
		return this.settingsNode.get(settingsKeywords.columnWidth)
	}

	_compiled = ""
	get compiled() {
		if (!this._compiled) this._compiled = this.scrollScriptProgram.compile()
		return this._compiled
	}

	get htmlCode() {
		return this.compiled + (this.sourceLink ? `<p class="${cssClasses.scrollFileSourceLinkComponent}"><a href="${this.sourceLink}">File source</a></p>` : "")
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

	toRss() {
		const { title, permalink, baseUrl } = this
		return ` <item>
  <title>${title}</title>
  <link>${baseUrl + permalink}</link>
 </item>`
	}
}

// Todo: deprecate/remove/split out into sep project?
class RssImporter {
	constructor(path) {
		this.path = path
	}
	path = ""

	savePost(item, content, destinationFolder) {
		const { title, pubDate, isoDate } = item
		const date = pubDate || isoDate ? `${scrollKeywords.date} ${pubDate || isoDate}` : ""
		const scrollFile = `${scrollKeywords.title} ${title}
${date}
${scrollKeywords.paragraph}
 ${removeReturnCharsAndRightShift(content, 1)}
`
		write(path.join(destinationFolder, Utils.stringToPermalink(title) + SCROLL_FILE_EXTENSION), scrollFile)
	}

	async downloadFilesTo(destinationFolder) {
		const Parser = require("rss-parser")
		const got = require("got")
		const cheerio = require("cheerio")

		const parser = new Parser()

		console.log(`⏳ downloading '${this.path}'`)
		const feed = await parser.parseURL(this.path)

		await Promise.all(
			feed.items.map(async item => {
				if (item.content) return this.savePost(item, item.content, destinationFolder)

				try {
					console.log(`⏳ downloading '${item.link}'`)
					const response = await got(item.link)
					const html = response.body
					const dom = cheerio.load(html)
					this.savePost(item, dom.text(), destinationFolder)
				} catch (err) {
					console.log(`❌ downloading '${item.link}'`)
				}
			})
		)
	}
}

class AbstractTemplate {
	constructor(file) {
		this.file = file
	}

	get folder() {
		return this.file.folder
	}

	// todo: remove
	get folderSettings() {
		return this.folder.settings
	}

	get htmlTitle() {
		return this.folderSettings.title
	}

	get description() {
		return this.folderSettings.description
	}

	get github() {
		return this.folderSettings.github
	}

	get email() {
		return this.folderSettings.email
	}

	get twitter() {
		return this.folderSettings.twitter
	}

	get baseUrl() {
		return this.folderSettings.baseUrl ?? ""
	}

	get header() {
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
  a ${this.folderSettings.title}
   href index.html
 div ${this.description}`
	}

	get footer() {
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
		return this.folderSettings.columnWidth ?? DEFAULT_COLUMN_WIDTH
	}

	get maxColumns() {
		// If undefined will be autocomputed
		return this.folderSettings.maxColumns
	}

	// Todo: scroll.css link thing fix.
	get styleCode() {
		// Default is to inline CSS. Otherwise we can split it into a sep file.
		const css = this.folderSettings[settingsKeywords.css]

		if (css === "none") return ""

		if (css === "split")
			return `link
   rel stylesheet
   type text/css
   href scroll.css`

		return `styleTag
   bern
    ${removeReturnCharsAndRightShift(SCROLL_CSS, 4)}`
	}

	get rssTag() {
		const { rssFeedUrl } = this.folder
		if (!rssFeedUrl) return ""
		return `link
 rel alternate
 type application/rss+xml
 title ${this.folderSettings.title}
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
   content ${this.description}
  meta
   name generator
   content Scroll v${SCROLL_VERSION}
  meta
   property og:title
   content ${this.ogTitle}
  meta
   property og:description
   content ${this.ogDescription}
  meta
   property og:image
   content ${this.ogImage ? this.baseUrl + this.ogImage : ""}
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

	get ogTitle() {
		return this.folderSettings.title
	}

	get ogDescription() {
		return this.description
	}

	get ogImage() {
		return ""
	}

	toHtml() {
		return scrollBoilerplateCompiledMessage + "\n" + new stump(this.stumpCode).compile()
	}
}

class NoTemplate extends AbstractTemplate {
	toHtml() {
		return this.file.compiled
	}
}

class FileTemplate extends AbstractTemplate {
	get columnWidth() {
		return this.file.columnWidth || super.columnWidth
	}

	get maxColumns() {
		return this.file.maxColumns || super.maxColumns
	}

	get header() {
		const header = this.file.settingsNode.getNode(settingsKeywords.header)
		if (header) return header.childrenToString()
		return super.header
	}

	get footer() {
		const footer = this.file.settingsNode.getNode(settingsKeywords.footer)
		if (footer) return footer.childrenToString()
		return super.footer
	}

	get ogDescription() {
		return this.file.ogDescription
	}

	get ogImage() {
		return this.file.ogImage
	}

	get ogTitle() {
		return this.file.title
	}

	get htmlTitle() {
		if (this.file.htmlTitle) return this.file.htmlTitle

		const { title } = this.file
		return (title ? `${title} - ` : "") + this.folderSettings.title
	}

	get pageCode() {
		const { file } = this
		return `h1
 class ${cssClasses.scrollFilePageTitle}
 a ${this.ogTitle}
  href ${file.permalink}
div
 class ${cssClasses.scrollFilePageComponent}
 style ${this.cssColumnWorkaround}
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
	get groupName() {
		return this.file.get("template").getWord(2)
	}

	get pageCode() {
		const { folder, groupName } = this
		const files = folder
			.getGroup(groupName)
			.map(file => {
				const node = new TreeNode(`div
 class ${cssClasses.scrollGroupPageFileContainerComponent}`)
				node.getNode("div").appendLineAndChildren("bern", this.getFileHtml(file))
				return node.toString()
			})
			.join("\n")

		return `div
 class ${cssClasses.scrollGroupPageComponent}
 style column-width:${this.columnWidth}ch;
 ${removeReturnCharsAndRightShift(files, 1)}`
	}

	getFileHtml(file) {
		return file.htmlCode
	}
}

class SnippetsGroupTemplate extends GroupTemplate {
	getFileHtml(file) {
		return file.htmlCodeForSnippetsPage
	}
}

class ScrollPage {
	constructor(content = "") {
		this.content = content
	}

	content = ""

	get html() {
		const scrollFolder = new ScrollFolder(undefined, "")
		const { scrollScriptCompiler } = scrollFolder
		const program = new scrollScriptCompiler(this.content)
		const file = new ScrollFile(program, "", "", scrollFolder)
		return file.html
	}
}

class ScrollFolder {
	constructor(scrollFolder = __dirname, settingsContent = undefined) {
		this.scrollFolder = path.normalize(scrollFolder)
		this._settingsContent = settingsContent !== undefined ? settingsContent : fs.existsSync(this.settingsFilepath) ? read(this.settingsFilepath) : ""

		this.grammarFiles = DefaultGrammarFiles
		this._initCustomGrammarFiles()
		this.scrollScriptCompiler = getCompiler(this.grammarFiles)
	}

	getGroup(groupName) {
		return this.files.filter(file => file.groups.includes(groupName))
	}

	// Loads any grammar files in the scroll folder. TODO: Deprecate this? Move to explicit inclusion of grammar nodes on a per file basis?
	_initCustomGrammarFiles() {
		this.grammarFiles = this.grammarFiles.slice()
		this.fullFilePaths.filter(fullFilePath => fullFilePath.endsWith(GRAMMAR_EXTENSION)).forEach(file => this.grammarFiles.push(file))
	}

	grammarFiles = []

	get grammarErrors() {
		return new grammarNode(this.grammarFiles.map(file => read(file)).join("\n")).getAllErrors().map(err => err.toObject())
	}

	get fullFilePaths() {
		return Disk.getFiles(this.scrollFolder)
	}

	_files
	get files() {
		if (this._files) return this._files
		const { gitLink, scrollScriptCompiler, fullFilePaths } = this
		const all = fullFilePaths.filter(file => file.endsWith(SCROLL_FILE_EXTENSION)).map(fullFilePath => new ScrollFile(new scrollScriptCompiler(read(fullFilePath)), fullFilePath, gitLink ? gitLink + path.basename(fullFilePath) : "", this))
		this._files = lodash.sortBy(all, file => file.timestamp).reverse()
		return this._files
	}

	get gitLink() {
		return this.settings[settingsKeywords.git] + "/"
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

	_settingsContent = ""

	_settings
	get settings() {
		if (!this._settings) this._settings = { ...this.settingsTree.toObject() }
		return this._settings
	}

	_settingsTree
	get settingsTree() {
		if (!this._settingsTree) this._settingsTree = new TreeNode(this._settingsContent).getNode(scrollKeywords.settings) || new TreeNode("")
		return this._settingsTree
	}

	get settingsFilepath() {
		return path.join(this.scrollFolder, SCROLL_SETTINGS_FILENAME)
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
				if (p3.startsWith("https://") || p3.startsWith("http://")) prefix = ""
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
	scrollFolder = ""

	logIndent = 0
	log(message) {
		const indent = "    ".repeat(this.logIndent)
		if (this.verbose) console.log(indent + message)
		return message
	}

	buildFiles() {
		return this._buildAndWriteFiles()
	}

	_publishedFiles = new Map()
	_buildAndWriteFiles() {
		const start = Date.now()
		const { settings, files, scrollFolder } = this
		const filesToBuild = files.filter(file => file.shouldBuild)
		this.log(`Building ${filesToBuild.length} files from ${files.length} ${SCROLL_FILE_EXTENSION} files found in '${scrollFolder}'\n`)
		this.logIndent++
		const pages = filesToBuild.map(file => {
			const { permalink, html } = file
			if (this._publishedFiles.get(permalink) === html) return "Unmodified"
			this.write(permalink, html, `Wrote ${file.filename} to ${permalink}`)
			this._publishedFiles.set(permalink, html)
			return { permalink, html }
		})
		const seconds = (Date.now() - start) / 1000
		this.logIndent--
		this.log(``)
		this.log(`⌛️ Compiled ${pages.length} files to html in ${seconds} seconds. ${lodash.round(pages.length / seconds)} pages per second\n`)

		return pages
	}

	get rssFeedUrl() {
		return this.settings[settingsKeywords.rssFeedUrl]
	}

	write(filename, content, message) {
		const result = write(path.join(this.scrollFolder, filename), content)
		this.log(`💾 ` + message)
		return result
	}

	buildAll() {
		this.log(`\n👷 building folder '${this.scrollFolder}\n'`)
		this.logIndent++
		this.buildFiles()
		this.logIndent--
	}

	// rss, twitter, hn, reddit, pinterest, instagram, tiktok, youtube?
	async importSite() {
		const importFrom = this.settings.importFrom

		if (!importFrom)
			return `❌ You need to define an import source in '${SCROLL_SETTINGS_FILENAME}' like 'settings
 ${scrollKeywords.importFrom} https://example.com/feed.rss`

		// A loose check for now to catch things like "format=rss"
		if (importFrom.includes("rss") || importFrom.includes("feed")) {
			const importer = new RssImporter(importFrom)
			return await importer.downloadFilesTo(this.scrollFolder)
		}

		return `❌ Scroll wasn't sure how to import '${importFrom}'.\n💡 You can open an issue here: https://github.com/breck7/scroll/issues`
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
		if (doesFolderHaveASettingsDotScrollFile(cwd)) return this.log(`❌ Initialization aborted. Folder '${cwd}' already contains a '${SCROLL_SETTINGS_FILENAME}'.`)
		this.log(`Initializing scroll in "${cwd}"`)
		write(path.join(cwd, SCROLL_SETTINGS_FILENAME), read(path.join(__dirname, SCROLL_SETTINGS_FILENAME)))
		const readmePath = path.join(cwd, "readme.scroll")
		if (!fs.existsSync(readmePath)) write(readmePath, initReadmePage)
		return this.log(`\n👍 Initialized new scroll in '${cwd}'. Build your new site with: scroll build`)
	}

	deleteCommand() {
		return this.log(`\n💡 To delete a Scroll just delete the folder\n`)
	}

	async importCommand(cwd) {
		const fullPath = resolvePath(cwd)
		if (!doesFolderHaveASettingsDotScrollFile(fullPath)) return this.log(`❌ Folder '${cwd}' has no '${SCROLL_SETTINGS_FILENAME}' file.`)
		const folder = new ScrollFolder(cwd)
		const result = await folder.importSite()
		return this.log(result)
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
		const folder = folderOrErrorMessage
		const { scrollFolder } = folder

		this.log(`\n🔭 Watching for changes in 📁 ${scrollFolder}`)

		this._watcher = fs.watch(scrollFolder, (event, filename) => {
			const fullFilePath = path.join(scrollFolder, filename)
			if (!fullFilePath.endsWith(SCROLL_FILE_EXTENSION)) return
			this.log(`\n✅ "${fullFilePath}" changed.`)

			if (!Disk.exists(fullFilePath)) {
				// file deleted
			} else if (false) {
				// new file
			} else {
				// file updates
			}
			const newFolder = new ScrollFolder(scrollFolder)
			newFolder.verbose = folder.verbose
			newFolder.buildAll()
		})

		if (this.verbose) await open(`file://${scrollFolder}/index.html`)
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

module.exports = { ScrollFolder, ScrollCli, SCROLL_SETTINGS_FILENAME, scrollKeywords, settingsKeywords, ScrollPage, DefaultScrollScriptCompiler, SCROLL_CSS }
