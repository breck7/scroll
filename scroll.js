#! /usr/bin/env node

// NPM ecosystem includes
const parseArgs = require("minimist")
const path = require("path")
const fs = require("fs")
const lodash = require("lodash")
const dayjs = require("dayjs")
const open = require("open")
const semver = require("semver")

// Tree Notation Includes
const { jtree } = require("jtree")
const { TreeNode, Utils } = jtree
const { Disk } = require("jtree/products/Disk.node.js")
const grammarNode = require("jtree/products/grammar.nodejs.js")
const stump = require("jtree/products/stump.nodejs.js")

// Helper utils
const read = fullFilePath => fs.readFileSync(fullFilePath, "utf8").replace(/\r/g, "") // Note: This also removes \r. There's never a reason to use \r.
const write = (fullFilePath, content) => fs.writeFileSync(fullFilePath, content, "utf8")
const removeReturnCharsAndRightShift = (str, numSpaces) => str.replace(/\r/g, "").replace(/\n/g, "\n" + " ".repeat(numSpaces))
const unsafeStripHtml = html => html.replace(/<[^>]*>?/gm, "")
// Normalize 3 possible inputs: 1) cwd of the process 2) provided absolute path 3) cwd of process + provided relative path
const resolvePath = (folder = "") => (path.isAbsolute(folder) ? path.normalize(folder) : path.resolve(path.join(process.cwd(), folder)))

// Constants
const packageJson = require("./package.json")
const SCROLL_SRC_FOLDER = __dirname
const SCROLL_VERSION = packageJson.version
const SCROLL_FILE_EXTENSION = ".scroll"
const SCROLL_GRAMMAR_EXTENSION = ".grammar"
const SCROLLDOWN_GRAMMAR_FILENAME = "scrolldown.grammar"
const SCROLL_SETTINGS_FILENAME = "scroll.settings"
const EXTENSIONS_REQUIRING_REBUILD = new RegExp(`${[SCROLL_FILE_EXTENSION, SCROLL_SETTINGS_FILENAME, SCROLL_GRAMMAR_EXTENSION].join("|")}$`)

// This is all the CSS
const hakon = require("jtree/products/hakon.nodejs.js")
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
	scrollIndexPageComponent: "scrollIndexPageComponent",
	scrollIndexPageArticleContainerComponent: "scrollIndexPageArticleContainerComponent",
	scrollArticleSourceLinkComponent: "scrollArticleSourceLinkComponent",
	scrollArticlePageComponent: "scrollArticlePageComponent",
	scrollSingleArticleTitle: "scrollSingleArticleTitle"
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
	importFrom: "importFrom",
	skipIndexPage: "skipIndexPage",
	endSnippet: "endSnippet",
	maxColumns: "maxColumns",
	header: "header",
	footer: "footer",
	columnWidth: "columnWidth"
}

// todo: move all keywords here
const settingsKeywords = {
	ignoreGrammarFiles: "ignoreGrammarFiles",
	git: "git",
	scrollVersion: "scrollVersion",
	baseUrl: "baseUrl",
	css: "css" // "none", "split", or "inline". If not set defaults to "inline"
}

const defaultSettings = {
	twitter: "",
	github: "",
	email: "",
	description: "",
	title: "",
	baseUrl: ""
}

const initReadmePage = `${scrollKeywords.title} Hello world
${scrollKeywords.date} ${dayjs().format(`MM-DD-YYYY`)}

${scrollKeywords.paragraph}
 This is my new Scroll.`

const isScrollFolder = absPath => fs.existsSync(path.normalize(path.join(absPath, SCROLL_SETTINGS_FILENAME)))

const SCROLL_ICONS = new TreeNode(read(path.join(SCROLL_SRC_FOLDER, "scroll.icons"))).toObject()

class Article {
	constructor(scrolldownProgram, filePath, sourceLink, baseUrl) {
		this.scrolldownProgram = scrolldownProgram
		this._sourceLink = sourceLink
		this.filePath = filePath
		this.filename = path.basename(filePath)
		this.baseUrl = baseUrl
		scrolldownProgram.setPermalink(this.permalink)
		scrolldownProgram.setFolder(path.dirname(filePath))
	}

	save() {
		write(`${this.filePath}`, this.scrolldownProgram.toString())
	}

	_sourceLink = ""
	filename = ""
	filePath = ""
	baseUrl = ""

	get permalink() {
		return this.scrolldownProgram.get(scrollKeywords.permalink) || this.filename.replace(/\.scroll$/, "")
	}

	get ogImage() {
		const index = this.scrolldownProgram.indexOf(scrollKeywords.image)
		return index > -1 ? this.scrolldownProgram.nodeAt(index).getContent() : ""
	}

	// Use the first paragraph for the description
	get ogDescription() {
		const program = this.scrolldownProgram
		for (let node of program.getTopDownArrayIterator()) {
			const word = node.getWord(0)
			if (word === scrollKeywords.paragraph || word === scrollKeywords.aftertext)
				return unsafeStripHtml(node.compile())
					.replace(/\n/g, " ")
					.substr(0, 300)
		}
		return ""
	}

	get includeInIndex() {
		return !this.scrolldownProgram.has(scrollKeywords.skipIndexPage)
	}

	get title() {
		return this.scrolldownProgram.get(scrollKeywords.title) ?? ""
	}

	get htmlTitle() {
		return this.scrolldownProgram.get(scrollKeywords.htmlTitle)
	}

	get sourceLink() {
		return this.scrolldownProgram.get(scrollKeywords.sourceLink) || this._sourceLink
	}

	get timestamp() {
		return dayjs(this.scrolldownProgram.get(scrollKeywords.date) ?? 0).unix()
	}

	get maxColumns() {
		return this.scrolldownProgram.get(scrollKeywords.maxColumns)
	}

	get columnWidth() {
		return this.scrolldownProgram.get(scrollKeywords.columnWidth)
	}

	_htmlCode = ""
	get htmlCode() {
		if (!this._htmlCode) this._htmlCode = this.scrolldownProgram.compile() + (this.sourceLink ? `<p class="${cssClasses.scrollArticleSourceLinkComponent}"><a href="${this.sourceLink}">Article source</a></p>` : "")
		return this._htmlCode
	}

	get htmlCodeForSnippetsPage() {
		const { snippetBreakNode } = this
		if (!snippetBreakNode) return this.htmlCode

		const program = this.scrolldownProgram
		const indexOfBreak = snippetBreakNode.getIndex()
		return (
			program
				.map((child, index) => (index >= indexOfBreak ? "" : child.compile()))
				.filter(i => i)
				.join(program._getChildJoinCharacter()) + `<a class="scrollContinueReadingLink" href="${this.permalink}.html">Full article...</a>`
		)
	}

	get snippetBreakNode() {
		return this.scrolldownProgram.getNode(scrollKeywords.endSnippet)
	}

	toRss() {
		const { title, permalink, baseUrl } = this
		return ` <item>
  <title>${title}</title>
  <link>${baseUrl + permalink}.html</link>
 </item>`
	}
}

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
		write(path.join(destinationFolder, Utils.stringToPermalink(title) + ".scroll"), scrollFile)
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

class AbstractScrollPage {
	constructor(scroll) {
		this.scroll = scroll
	}

	get scrollSettings() {
		return this.scroll.settings
	}

	get htmlTitle() {
		return this.scrollSettings.title
	}

	get description() {
		return this.scrollSettings.description
	}

	get github() {
		return this.scrollSettings.github
	}

	get email() {
		return this.scrollSettings.email
	}

	get twitter() {
		return this.scrollSettings.twitter
	}

	get baseUrl() {
		return this.scrollSettings.baseUrl ?? ""
	}

	get customHeader() {
		return this.scroll.settingsTree.getNode(scrollKeywords.header)
	}

	get customFooter() {
		return this.scroll.settingsTree.getNode(scrollKeywords.footer)
	}

	get header() {
		const { customHeader } = this
		if (customHeader) return customHeader.childrenToString()
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
  a ${this.scrollSettings.title}
   href index.html
 div ${this.description}`
	}

	get footer() {
		const { customFooter } = this
		if (customFooter) return customFooter.childrenToString()
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
		return this.scrollSettings.columnWidth ?? DEFAULT_COLUMN_WIDTH
	}

	get maxColumns() {
		// If undefined will be autocomputed
		return this.scrollSettings.maxColumns
	}

	get styleCode() {
		// Default is to inline CSS. Otherwise we can split it into a sep file.
		const css = this.scrollSettings[settingsKeywords.css]

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
		if (!this.scroll.rssFeedUrl) return ""
		return `link
 rel alternate
 type application/rss+xml
 title ${this.scrollSettings.title}
 href ${this.scroll.rssFeedUrl}`
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
		return this.scrollSettings.title
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

class ScrollPage {
	constructor(content = "", settings = "") {
		this.settings = settings
		this.content = content
	}

	settings = ""
	content = ""

	get html() {
		const scrollFolder = new ScrollFolder(undefined, this.settings)
		const { scrolldownCompiler } = scrollFolder
		const program = new scrolldownCompiler(this.content)
		const article = new Article(program, "", "", scrollFolder.settings.baseUrl)
		return new ScrollArticlePage(scrollFolder, article).toHtml()
	}
}

class ScrollArticlePage extends AbstractScrollPage {
	constructor(scroll, article) {
		super(scroll)
		this.article = article
	}

	get columnWidth() {
		return this.article.columnWidth || super.columnWidth
	}

	get maxColumns() {
		return this.article.maxColumns || super.maxColumns
	}

	get customHeader() {
		return this.article.scrolldownProgram.getNode(scrollKeywords.header) || super.customHeader
	}

	get customFooter() {
		return this.article.scrolldownProgram.getNode(scrollKeywords.footer) || super.customFooter
	}

	get ogDescription() {
		return this.article.ogDescription
	}

	get ogImage() {
		return this.article.ogImage
	}

	get ogTitle() {
		return this.article.title
	}

	get htmlTitle() {
		if (this.article.htmlTitle) return this.article.htmlTitle

		const { title } = this.article
		return (title ? `${title} - ` : "") + this.scrollSettings.title
	}

	get pageCode() {
		return `h1
 class ${cssClasses.scrollSingleArticleTitle}
 a ${this.ogTitle}
  href ${this.article.permalink}.html
div
 class ${cssClasses.scrollArticlePageComponent}
 style ${this.cssColumnWorkaround}
 bern
  ${removeReturnCharsAndRightShift(this.article.htmlCode, 2)}`
	}

	get estimatedLines() {
		return lodash.sum(this.article.scrolldownProgram.map(node => (node.getLine() === "" ? 0 : node.getTopDownArray().length)))
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

class ScrollIndexPage extends AbstractScrollPage {
	get pageCode() {
		const articles = this.scroll.articlesToIncludeInIndex
			.map(article => {
				const node = new TreeNode(`div
 class ${cssClasses.scrollIndexPageArticleContainerComponent}`)
				node.getNode("div").appendLineAndChildren("bern", this.getArticleHtml(article))
				return node.toString()
			})
			.join("\n")

		return `div
 class ${cssClasses.scrollIndexPageComponent}
 style column-width:${this.columnWidth}ch;
 ${removeReturnCharsAndRightShift(articles, 1)}`
	}

	getArticleHtml(article) {
		return article.htmlCode
	}
}

class ScrollSnippetsPage extends ScrollIndexPage {
	getArticleHtml(article) {
		return article.htmlCodeForSnippetsPage
	}
}

const compilerCache = new Map()
const getCompiler = filePaths => {
	const key = filePaths.join("\n")
	const hit = compilerCache.get(key)
	if (hit) return hit
	const compiler = new jtree.HandGrammarProgram(filePaths.map(file => read(file)).join("\n")).compileAndReturnRootConstructor()
	compilerCache.set(key, compiler)
	return compiler
}

class ScrollRssFeed {
	constructor(scroll) {
		this.scroll = scroll
	}

	toXml() {
		const { title, baseUrl, description } = this.scroll.settings
		return `<?xml version="1.0" encoding="ISO-8859-1" ?>
<rss version="0.91">
<channel>
 <title>${title}</title>
 <link>${baseUrl}</link>
 <description>${description}</description>
 <language>en-us</language>
${this.scroll.articlesToIncludeInIndex.map(article => article.toRss()).join("\n")}
</channel>
</rss>`
	}
}

class ScrollFolder {
	constructor(scrollFolder = __dirname, settingsContent = undefined) {
		this.scrollFolder = path.normalize(scrollFolder)
		this._settingsContent = settingsContent !== undefined ? settingsContent : fs.existsSync(this.settingsFilepath) ? read(this.settingsFilepath) : ""

		this.grammarFiles = [path.join(__dirname, SCROLLDOWN_GRAMMAR_FILENAME)]
		if (this.useCustomGrammarFiles) this._initCustomGrammarFiles()
	}

	_initCustomGrammarFiles() {
		this.fullFilePaths
			.filter(fullFilePath => fullFilePath.endsWith(SCROLL_GRAMMAR_EXTENSION) && !fullFilePath.endsWith(SCROLLDOWN_GRAMMAR_FILENAME))
			.forEach(file => {
				this.grammarFiles.push(file)
			})
	}

	grammarFiles = []

	get scrolldownCompiler() {
		return getCompiler(this.grammarFiles)
	}

	get useCustomGrammarFiles() {
		return this.settingsTree.has(settingsKeywords.ignoreGrammarFiles) ? false : true
	}

	get grammarErrors() {
		return new grammarNode(this.grammarFiles.map(file => read(file)).join("\n")).getAllErrors().map(err => err.toObject())
	}

	get fullFilePaths() {
		return Disk.getFiles(this.scrollFolder)
	}

	_articles
	get allArticles() {
		if (this._articles) return this._articles
		const { gitLink, scrolldownCompiler, fullFilePaths } = this
		const all = fullFilePaths
			.filter(file => file.endsWith(SCROLL_FILE_EXTENSION))
			.map(fullFilePath => new Article(new scrolldownCompiler(read(fullFilePath)), fullFilePath, gitLink ? gitLink + path.basename(fullFilePath) : "", this.settings.baseUrl))
		this._articles = lodash.sortBy(all, article => article.timestamp).reverse()
		return this._articles
	}

	get articlesToIncludeInIndex() {
		return this.allArticles.filter(article => article.includeInIndex)
	}

	get gitLink() {
		return this.settings[settingsKeywords.git] + "/"
	}

	get errors() {
		return this.allArticles
			.map(article =>
				article.scrolldownProgram.getAllErrors().map(err => {
					return { filename: article.filename, ...err.toObject() }
				})
			)
			.flat()
	}

	_settingsContent = ""

	_settings
	get settings() {
		if (!this._settings) this._settings = { ...defaultSettings, ...this.settingsTree.toObject() }
		return this._settings
	}

	_settingsTree
	get settingsTree() {
		if (!this._settingsTree) this._settingsTree = new TreeNode(this._settingsContent)
		return this._settingsTree
	}

	get settingsFilepath() {
		return path.join(this.scrollFolder, SCROLL_SETTINGS_FILENAME)
	}

	get onScrollVersion() {
		return this.settingsTree.toObject()[scrollKeywords.scrollVersion]
	}

	migrate(fromVersion) {
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

		if (semver.lt(fromVersion, "24.0.0")) {
			// Articles that have a date, a paragraph, and no dateline added yet need one
			console.log(`🚚 Applying 24.0.0 migrations`)
			this.allArticles.forEach(article => {
				const content = article.scrolldownProgram
				const ps = content.findNodes("paragraph")
				if (content.has("date") && content.has("paragraph") && content.findNodes("aftertext dateline").length === 0) {
					const firstParagraph = ps.shift()
					updateParagraph(firstParagraph)
					firstParagraph.appendLine("dateline")
				}
				ps.forEach(updateParagraph)
				article.save()
			})
		}

		return this
	}

	silence() {
		this.verbose = false
		return this
	}

	verbose = true
	scrollFolder = ""

	get indexPage() {
		return new ScrollIndexPage(this)
	}

	log(message) {
		if (this.verbose) console.log(message)
		return message
	}

	buildSinglePages() {
		return this._buildAndWriteSinglePages()
	}
	_singlePages = new Map()
	_buildAndWriteSinglePages() {
		const start = Date.now()
		const { settings, allArticles } = this
		const pages = allArticles.map(article => {
			const permalink = `${article.permalink}.html`
			const html = new ScrollArticlePage(this, article).toHtml()
			if (this._singlePages.get(permalink) === html) return "Unmodified"
			this.write(permalink, html)
			this._singlePages.set(permalink, html)
			this.log(`Wrote ${permalink} to disk`)
			return { permalink, html }
		})
		const seconds = (Date.now() - start) / 1000
		this.log(`⌛️ built ${pages.length} html files in ${seconds} seconds. ${lodash.round(pages.length / seconds)} pages per second`)
		return pages
	}

	_cachedPages = {}
	_buildAndWriteCollectionPage(filename, articles, page) {
		if (articles.length === 0) return this.log(`Skipping build of '${filename}' because no articles to include.`)
		const html = page.toHtml()
		if (this._cachedPages[filename] !== html) {
			const start = Date.now()
			this.write(filename, html)
			this._cachedPages[filename] = html
			this.log(`Built and wrote new ${filename} to disk in ${(Date.now() - start) / 1000} seconds`)
		}
		return html
	}

	buildIndexPage(filename = "index.html") {
		return this._buildAndWriteCollectionPage(filename, this.articlesToIncludeInIndex, this.indexPage)
	}

	buildSnippetsPage(filename = "snippets.html") {
		return this._buildAndWriteCollectionPage(filename, this.articlesToIncludeInIndex, new ScrollSnippetsPage(this))
	}

	get rssFilename() {
		return "feed.xml"
	}

	get rssFeedUrl() {
		const baseUrl = this.settings[settingsKeywords.baseUrl]
		return baseUrl ? baseUrl + this.rssFilename : ""
	}

	buildRssFeed(filename = this.rssFilename) {
		return this.write(filename, new ScrollRssFeed(this).toXml())
	}

	buildCssFile(filename = "scroll.css") {
		return this.write(filename, SCROLL_CSS)
	}

	write(filename, content) {
		return write(path.join(this.scrollFolder, filename), content)
	}

	buildAll() {
		this.buildIndexPage()
		this.buildSinglePages()
		if (this.shouldBuildSnippetsPage) this.buildSnippetsPage()
		if (this.settings[settingsKeywords.baseUrl]) this.buildRssFeed()
		if (this.settings[settingsKeywords.css] === "split") this.buildCssFile()
	}

	get shouldBuildSnippetsPage() {
		return this.allArticles.some(article => !!article.snippetBreakNode)
	}

	// rss, twitter, hn, reddit, pinterest, instagram, tiktok, youtube?
	async importSite() {
		const { importFrom } = this

		if (!importFrom) return `❌ You need to add a line to '${this.settingsFilepath}' like '${scrollKeywords.importFrom}'`

		// A loose check for now to catch things like "format=rss"
		if (importFrom.includes("rss") || importFrom.includes("feed")) {
			const importer = new RssImporter(importFrom)
			return await importer.downloadFilesTo(this.scrollFolder)
		}

		return `❌ Scroll wasn't sure how to import '${importFrom}'.\n💡 You can open an issue here: https://github.com/publicdomaincompany/scroll/issues`
	}

	get importFrom() {
		return this.settings.importFrom
	}

	get localIndexAsUrl() {
		return `file://${this.scrollFolder}/index.html`
	}
}

class ScrollCli {
	execute(args = []) {
		this.log(`\n📜📜📜 WELCOME TO SCROLL (v${SCROLL_VERSION}) 📜📜📜`)
		const command = args[0] // Note: we don't take any parameters on purpose. Simpler UX.
		const commandName = `${command}${CommandFnDecoratorSuffix}`
		const cwd = process.cwd()
		if (this[commandName]) return this[commandName](cwd)

		this.log(`No command provided. Running help command.`)
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
		if (isScrollFolder(cwd)) return this.log(`❌ Initialization aborted. Folder '${cwd}' already contains a '${SCROLL_SETTINGS_FILENAME}'.`)
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
		if (!isScrollFolder(fullPath)) return this.log(`❌ Folder '${cwd}' has no '${SCROLL_SETTINGS_FILENAME}' file.`)
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
		const currentVersion = folder.onScrollVersion ?? "23.0.0"
		folder.migrate(currentVersion)
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
			if (!EXTENSIONS_REQUIRING_REBUILD.test(fullFilePath)) return
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

		if (this.verbose) await open(folder.localIndexAsUrl)
		return this
	}

	_watcher = undefined

	stopWatchingForFileChanges() {
		this._watcher.close()
		this._watcher = undefined
	}

	helpCommand() {
		return this.log(`\nThis is the Scroll help page.\n\nCommands you can run from your Scroll's folder:\n\n${this._allCommands.map(comm => `🖌️ ` + comm.replace(CommandFnDecoratorSuffix, "")).join("\n")}\n​​`)
	}
}

if (module && !module.parent) new ScrollCli().execute(parseArgs(process.argv.slice(2))._)

module.exports = { ScrollFolder, ScrollCli, SCROLL_SETTINGS_FILENAME, SCROLLDOWN_GRAMMAR_FILENAME, scrollKeywords, ScrollPage }
