#! /usr/bin/env node

// NPM ecosystem includes
const parseArgs = require("minimist")
const glob = require("glob")
const path = require("path")
const fse = require("fs-extra")
const fs = require("fs")
const lodash = require("lodash")
const dayjs = require("dayjs")
const open = require("open")

// Tree Notation Includes
const { jtree } = require("jtree")
const { TreeNode, Utils } = jtree
const hakon = require("jtree/products/hakon.nodejs.js")
const stump = require("jtree/products/stump.nodejs.js")
const { Disk } = require("jtree/products/Disk.node.js")
const grammarNode = require("jtree/products/grammar.nodejs.js")

// Constants
const packageJson = require("./package.json")
const SCROLL_VERSION = packageJson.version
const SCROLL_FILE_EXTENSION = ".scroll"
const DEFAULT_PORT = 1145
const SCROLLDOWN_GRAMMAR_FILENAME = "scrolldown.grammar"
const SCROLL_HAKON_FILENAME = "scroll.hakon"
const SCROLL_STUMP_FILENAME = "scroll.stump"
const SCROLL_SETTINGS_FILENAME = "scroll.settings"
const EXTENSIONS_REQUIRING_REBUILD = new RegExp(`${[SCROLL_FILE_EXTENSION, SCROLL_SETTINGS_FILENAME, SCROLLDOWN_GRAMMAR_FILENAME, SCROLL_HAKON_FILENAME, SCROLL_STUMP_FILENAME].join("|")}$`)

const SCROLL_SRC_FOLDER = __dirname + "/"
const CommandFnDecoratorSuffix = "Command"
const scrollBoilerplateCompiledMessage = `<!--

 This page was compiled by 📜 Scroll, the public domain
 static site publishing software.
 
 http://scroll.publicdomaincompany.com/
 
 Generally you don't want to edit it by hand.

 Scroll v${SCROLL_VERSION}

-->
<!doctype html>`

const initReadmePage = `title Hello world
date ${dayjs().format(`MM-DD-YYYY`)}

paragraph
 This is my new Scroll.`

const cssClasses = {
	scrollPage: "scrollPage",
	scrollArticleCell: "scrollArticleCell",
	scrollArticleSourceLink: "scrollArticleSourceLink",
	scrollSingleArticle: "scrollSingleArticle"
}

const scrollKeywords = {
	title: "title",
	permalink: "permalink",
	date: "date",
	importFrom: "importFrom",
	skipIndexPage: "skipIndexPage"
}

const defaultSettings = {
	twitter: "",
	github: "",
	email: "",
	description: "",
	title: ""
}

// LinkSuffixLang. [anyWord🔗absoluteUrl] or [anyWord🔗./relativeUrl]
// anyWord text cannot contain 🔗
// url should not contain the protocol. It will compile always to https. Use <a> if you need something else.
// If url ends in a period, that will be dropped.
// Url cannot contain a comma.
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
	if (p3.startsWith("https://")) prefix = ""
	return `${p1}<a href="${prefix}${p3}">${p2}</a>${suffix}`
}
const compileATags = text => text.replace(/(^|\s)(\S+)🔗(\S+)(?=(\s|$))/g, linkReplacer)

// Helper utils
const read = filename => fs.readFileSync(filename, "utf8").replace(/\r/g, "") // Note: This also removes \r. There's never a reason to use \r.
const write = (filename, content) => fs.writeFileSync(filename, content, "utf8")
const resolvePath = (folder = "") => (folder.startsWith("/") ? folder : path.resolve(process.cwd() + "/" + folder))
const isScrollFolder = absPath => fs.existsSync(path.normalize(absPath + "/" + SCROLL_SETTINGS_FILENAME))
const replaceAll = (str, search, replace) => str.split(search).join(replace)
const cleanAndRightShift = (str, numSpaces = 0) => str.replace(/\r/g, "").replace(/\n/g, "\n" + " ".repeat(numSpaces))

const SCROLL_ICONS = new TreeNode(read(SCROLL_SRC_FOLDER + "scroll.icons")).toObject()

const scrolldownGrammarCode = [read(`${__dirname}/${SCROLLDOWN_GRAMMAR_FILENAME}`)].join("\n")
const scrolldownGrammarCodeErrors = new grammarNode(scrolldownGrammarCode).getAllErrors().map(err => err.toObject())
if (scrolldownGrammarCodeErrors.length) console.error(new jtree.TreeNode(scrolldownGrammarCodeErrors).toFormattedTable(200))
const scrolldownCompiler = new jtree.HandGrammarProgram(scrolldownGrammarCode).compileAndReturnRootConstructor()

class Article {
	constructor(content = "", filename = "", sourceLink = "") {
		this.content = content
		this.tree = new TreeNode(this.content)
		this.sourceLink = sourceLink
		this.filename = filename
	}

	tree = undefined
	content = ""
	sourceLink = ""
	filename = ""

	get permalink() {
		return this.tree.get(scrollKeywords.permalink) || this.filename.replace(/\.scroll$/, "")
	}

	get maxColumns() {
		return this.tree.length < 20 ? 2 : 100
	}

	get includeInIndex() {
		return !this.tree.has(scrollKeywords.skipIndexPage)
	}

	get title() {
		return this.tree.get(scrollKeywords.title) ?? ""
	}

	get toScrolldownProgram() {
		return new scrolldownCompiler(this.content)
	}

	get timestamp() {
		return dayjs(this.tree.get(scrollKeywords.date) ?? 0).unix()
	}

	toStumpNode() {
		const node = new TreeNode(`div
 class ${cssClasses.scrollArticleCell}`)

		const sourceLink = this.sourceLink ? `<p class="${cssClasses.scrollArticleSourceLink}"><a href="${this.sourceLink}">Article source</a></p>` : ""

		const program = this.toScrolldownProgram
		program.setPermalink(this.permalink)
		node.getNode("div").appendLineAndChildren("bern", program.compile() + sourceLink)

		return new stump(node)
	}
}

class RssImporter {
	constructor(path) {
		this.path = path
	}
	path = ""

	savePost(item, content, destinationFolder) {
		const { title, pubDate, isoDate } = item
		const date = pubDate || isoDate ? `date ${pubDate || isoDate}` : ""
		const scrollFile = `title ${title}
${date}
paragraph
 ${cleanAndRightShift(content, 1)}
`
		write(destinationFolder + "/" + Utils.stringToPermalink(title) + ".scroll", scrollFile)
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

// todo: probably merge this into ScrollCLI
class ScrollBuilder {
	constructor(scrollFolder = __dirname) {
		this.scrollFolder = path.normalize(scrollFolder + "/")
	}

	get publishedArticles() {
		const gitLink = this.gitLink
		const all = Disk.getFiles(this.scrollFolder)
			.filter(file => file.endsWith(SCROLL_FILE_EXTENSION))
			.map(filename => new Article(read(filename), path.basename(filename), gitLink ? gitLink + path.basename(filename) : ""))
		return lodash.sortBy(all, article => article.timestamp).reverse()
	}

	get gitLink() {
		return this.settings.git + "/"
	}

	get errors() {
		return this.publishedArticles
			.map(article =>
				article.toScrolldownProgram.getAllErrors().map(err => {
					return { filename: article.filename, ...err.toObject() }
				})
			)
			.flat()
	}

	get settings() {
		return { ...defaultSettings, ...new TreeNode(read(this.scrollFolder + "/" + SCROLL_SETTINGS_FILENAME)).toObject() }
	}

	silence() {
		this.verbose = false
		return this
	}

	verbose = true
	scrollFolder = ""

	get settingsPath() {
		return this.scrollFolder + SCROLL_SETTINGS_FILENAME
	}

	get indexPage() {
		return this.articlesToHtml(this.publishedArticles.filter(article => article.includeInIndex))
	}

	get hakon() {
		return read(SCROLL_SRC_FOLDER + SCROLL_HAKON_FILENAME)
	}

	get stump() {
		return new TreeNode(read(SCROLL_SRC_FOLDER + SCROLL_STUMP_FILENAME))
	}

	// todo: refactor this. stump sucks. improve it.
	articlesToHtml(articles, htmlTitlePrefix = "") {
		const scrollDotHakon = this.hakon
		const scrollDotStump = this.stump
		const scrollIcons = SCROLL_ICONS

		const settings = this.settings
		const scrollTitle = settings.title

		const htmlTitle = (htmlTitlePrefix ? `${htmlTitlePrefix} - ` : "") + scrollTitle
		const userSettingsMap = { ...scrollIcons, ...settings, scrollTitle, htmlTitle }
		const isSingleArticle = articles.length === 1
		const stumpWithSettings = new TreeNode(scrollDotStump.templateToString(userSettingsMap)).expandLastFromTopMatter()

		const articleContainer = stumpWithSettings
			.getTopDownArray()
			.filter(node => node.getLine() === `class ${cssClasses.scrollPage}`)[0]
			.getParent() // todo: fix

		articleContainer.setChildren(`class ${cssClasses.scrollPage}${isSingleArticle ? ` ${cssClasses.scrollSingleArticle}` : ""}\n` + articles.map(article => article.toStumpNode().toString()).join("\n"))

		if (isSingleArticle) {
			const { maxColumns } = articles[0]
			if (maxColumns < 4) articleContainer.set("style", `columns: ${maxColumns};`)
		}

		const stumpNode = new stump(stumpWithSettings.toString())
		const styleTag = stumpNode.getNode("html head styleTag")
		styleTag.appendLineAndChildren("bern", new hakon(scrollDotHakon).compile())
		return scrollBoilerplateCompiledMessage + "\n" + stumpNode.compile()
	}

	log(message) {
		if (this.verbose) console.log(message)
		return message
	}

	previousVersion = ""

	singlePages = new Map()
	writeSinglePages() {
		const settings = this.settings
		return this.publishedArticles.map(article => {
			const permalink = `${article.permalink}.html`
			const html = this.articlesToHtml([article], article.title)
			if (this.singlePages.get(permalink) === html) return "Unmodified"
			write(`${this.scrollFolder}/${permalink}`, html)
			this.singlePages.set(permalink, html)
			this.log(`Wrote ${permalink} to disk`)
			return { permalink, html }
		})
	}

	buildIndexPage() {
		const file = this.indexPage
		if (this.previousVersion !== file) {
			const start = Date.now()
			write(this.scrollFolder + "/index.html", file)
			this.previousVersion = file
			this.log(`Built and wrote new index.html to disk in ${(Date.now() - start) / 1000} seconds`)
		}
		return file
	}

	// rss, twitter, hn, reddit, pinterest, instagram, tiktok, youtube?
	async importSite() {
		const { importFrom } = this

		if (!importFrom) return `❌ You need to add a line to '${this.settingsPath}' like '${scrollKeywords.importFrom}'`

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

	buildPages() {
		const start = Date.now()
		const pages = this.writeSinglePages()
		this.log(`⌛️ built ${pages.length} html files in ${(Date.now() - start) / 1000} seconds`)
	}

	get localIndexAsUrl() {
		return `file://${this.scrollFolder}/index.html`
	}

	async openBrowser() {
		await open(this.localIndexAsUrl)
	}

	watcher = undefined
	startWatching() {
		const { scrollFolder } = this

		this.log(`\n🔭 Watching for changes in 📁 ${scrollFolder}`)

		this.watcher = fs.watch(scrollFolder, (event, filename) => {
			const fullPath = scrollFolder + filename
			if (!EXTENSIONS_REQUIRING_REBUILD.test(fullPath)) return

			if (!Disk.exists(fullPath)) {
				// file deleted
			} else if (false) {
				// new file
			} else {
				// file updates
			}
			this.buildIndexPage()
			this.buildPages()
		})
	}

	stopWatchingForFileChanges() {
		this.watcher.close()
		delete this.watcher
	}
}

class ScrollCli {
	execute(args = []) {
		this.log(`\n📜📜📜 WELCOME TO SCROLL (v${SCROLL_VERSION}) 📜📜📜`)
		const command = args[0] // Note: we take only 1 parameter on purpose. Simpler UX.
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
		const builder = new ScrollBuilder()
		if (isScrollFolder(cwd)) return this.log(`❌ Initialization aborted. Folder '${cwd}' already contains a '${SCROLL_SETTINGS_FILENAME}'.`)
		this.log(`Initializing scroll in "${cwd}"`)
		write(cwd + "/" + SCROLL_SETTINGS_FILENAME, read(__dirname + "/" + SCROLL_SETTINGS_FILENAME))
		write(cwd + "/readme.scroll", initReadmePage)
		return this.log(`\n👍 Initialized new scroll in '${cwd}'. Build your new site with: scroll build`)
	}

	deleteCommand() {
		return this.log(`\n💡 To delete a Scroll just delete the folder\n`)
	}

	async importCommand(cwd) {
		const fullPath = resolvePath(cwd)
		if (!isScrollFolder(fullPath)) return this.log(`❌ Folder '${cwd}' has no '${SCROLL_SETTINGS_FILENAME}' file.`)

		const builder = new ScrollBuilder(cwd)
		const result = await builder.importSite()
		return this.log(result)
	}

	checkCommand(cwd) {
		const fullPath = resolvePath(cwd)
		if (!isScrollFolder(fullPath)) return this.log(`❌ Folder '${cwd}' has no '${SCROLL_SETTINGS_FILENAME}' file.`)
		const errs = new ScrollBuilder(fullPath).errors
		return this.log(errs.length ? new jtree.TreeNode(errs).toFormattedTable(60) : "0 errors")
	}

	async buildCommand(cwd) {
		const fullPath = resolvePath(cwd)
		if (!isScrollFolder(fullPath)) return this.log(`❌ Folder '${cwd}' has no '${SCROLL_SETTINGS_FILENAME}' file.`)

		const builder = new ScrollBuilder(fullPath)
		builder.verbose = this.verbose
		builder.writeSinglePages()
		builder.buildIndexPage()
		return builder
	}

	async watchCommand(cwd) {
		const builder = await this.buildCommand(cwd)
		if (!builder.startWatching) return
		builder.startWatching()
		builder.openBrowser()
		return builder
	}

	helpCommand() {
		return this.log(`\nThis is the Scroll help page.\n\nCommands you can run from your Scroll's folder:\n\n${this._allCommands.map(comm => `🖌️ ` + comm.replace(CommandFnDecoratorSuffix, "")).join("\n")}\n​​`)
	}
}

if (module && !module.parent) new ScrollCli().execute(parseArgs(process.argv.slice(2))._)

module.exports = { ScrollBuilder, ScrollCli, Article, SCROLL_SETTINGS_FILENAME, compileATags, scrollKeywords }
