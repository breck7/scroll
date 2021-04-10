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
const stamp = require("jtree/products/stamp.nodejs.js")
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
const SCROLL_SETTINGS_FILENAME = "scrollSettings.map"
const EXTENSIONS_REQUIRING_REBUILD = new RegExp(`${[SCROLL_FILE_EXTENSION, SCROLL_SETTINGS_FILENAME, SCROLLDOWN_GRAMMAR_FILENAME, SCROLL_HAKON_FILENAME, SCROLL_STUMP_FILENAME].join("|")}$`)

const SCROLL_SRC_FOLDER = __dirname + "/"
const exampleFolder = SCROLL_SRC_FOLDER + "example.com/"
const CommandFnDecoratorSuffix = "Command"
const scrollBoilerplateCompiledMessage = `<!--

 This page was compiled by 📜 Scroll, the public domain
 static site publishing software.
 
 http://scroll.publicdomaincompany.com/
 
 Generally you don't want to edit it by hand.

 Scroll v${SCROLL_VERSION}

-->`

const cssClasses = {
	scrollPage: "scrollPage",
	scrollArticleCell: "scrollArticleCell",
	scrollArticleSourceLink: "scrollArticleSourceLink",
	scrollSingleArticle: "scrollSingleArticle"
}

const scrollKeywords = {
	permalink: "permalink",
	date: "date",
	importFrom: "importFrom"
}

// Helper utils
const read = filename => fs.readFileSync(filename, "utf8")
const write = (filename, content) => fs.writeFileSync(filename, content, "utf8")
const resolvePath = (folder = "") => (folder.startsWith("/") ? folder : path.resolve(process.cwd() + "/" + folder))
const isScrollFolder = absPath => fs.existsSync(path.normalize(absPath + "/" + SCROLL_SETTINGS_FILENAME))
const replaceAll = (str, search, replace) => str.split(search).join(replace)
const cleanAndRightShift = (str, numSpaces = 0) => str.replace(/\r/g, "").replace(/\n/g, "\n" + " ".repeat(numSpaces))

const SCROLL_ICONS = new TreeNode(read(SCROLL_SRC_FOLDER + "scrollIcons.map")).toObject()

class Article {
	constructor(content = "", sourceLink = "") {
		this.content = content
		this.sourceLink = sourceLink
	}

	content = ""
	sourceLink = ""

	get scrolldownCompiler() {
		const grammarCode = [read(`${__dirname}/${SCROLLDOWN_GRAMMAR_FILENAME}`)].join("\n")

		const errs = new grammarNode(grammarCode).getAllErrors().map(err => err.toObject())
		if (errs.length) console.error(new jtree.TreeNode(errs).toFormattedTable(200))

		return new jtree.HandGrammarProgram(grammarCode).compileAndReturnRootConstructor()
	}

	get permalink() {
		return this.asTree.get(scrollKeywords.permalink) || path.basename(this.sourceLink).replace(/\.scroll$/, "")
	}

	get title() {
		return this.asTree.toObject().title ?? ""
	}

	get toScrolldownProgram() {
		return new this.scrolldownCompiler(this.content)
	}

	get asTree() {
		return new TreeNode(this.content)
	}

	get timestamp() {
		return dayjs(this.asTree.get(scrollKeywords.date) ?? 0).unix()
	}

	toStumpNode() {
		const node = new TreeNode(`div
 class ${cssClasses.scrollArticleCell}`)

		const sourceLink = this.sourceLink ? `<p class="${cssClasses.scrollArticleSourceLink}"><a href="${this.sourceLink}">Article source</a></p>` : ""

		node.getNode("div").appendLineAndChildren("bern", this.toScrolldownProgram.compile() + sourceLink)

		return new stump(node)
	}
}

class RssImporter {
	constructor(path) {
		this.path = path
	}
	path = ""

	async downloadFilesTo(destinationFolder) {
		const Parser = require("rss-parser")
		const got = require("got")
		const cheerio = require("cheerio")

		const parser = new Parser()

		console.log(`⏳ downloading '${this.path}'`)
		const feed = await parser.parseURL(this.path)

		await Promise.all(
			feed.items.map(async item => {
				try {
					console.log(`⏳ downloading '${item.link}'`)
					const response = await got(item.link)
					const html = response.body
					const dom = cheerio.load(html)
					const scrollFile = `title ${item.title}

paragraph
 ${cleanAndRightShift(dom.text(), 1)}
`
					write(destinationFolder + "/" + Utils.stringToPermalink(item.title) + ".scroll", scrollFile)
				} catch (err) {
					console.log(`❌ downloading '${item.link}'`)
				}
			})
		)
	}
}

// todo: probably merge this into ScrollCLI
class ScrollBuilder {
	constructor(scrollFolder = `${exampleFolder}`) {
		this.scrollFolder = path.normalize(scrollFolder + "/")
	}

	get publishedArticles() {
		const gitLink = this.gitLink
		const all = Disk.getFiles(this.scrollFolder)
			.filter(file => file.endsWith(SCROLL_FILE_EXTENSION))
			.map(filename => new Article(read(filename), gitLink ? gitLink + path.basename(filename) : ""))
		return lodash.sortBy(all, article => article.timestamp).reverse()
	}

	get gitLink() {
		return this.settings.git + "/"
	}

	get errors() {
		return this.publishedArticles.map(article => article.toScrolldownProgram.getAllErrors())
	}

	get settings() {
		const defaults = {
			twitter: "",
			github: "",
			email: ""
		}

		return { ...defaults, ...new TreeNode(read(this.scrollFolder + "/" + SCROLL_SETTINGS_FILENAME)).toObject() }
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
		return this.articlesToHtml(this.publishedArticles)
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
		const stumpWithSettings = new TreeNode(scrollDotStump.templateToString(userSettingsMap)).expandLastFromTopMatter()

		stumpWithSettings
			.getTopDownArray()
			.filter(node => node.getLine() === `class ${cssClasses.scrollPage}`)[0]
			.getParent() // todo: fix
			.setChildren(`class ${cssClasses.scrollPage}${articles.length === 1 ? ` ${cssClasses.scrollSingleArticle}` : ""}\n` + articles.map(article => article.toStumpNode().toString()).join("\n"))

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

		if (importFrom.endsWith("rss")) return new RssImporter(importFrom).downloadFilesTo(this.scrollFolder)

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

	// todo: current stamp sucks compared to what it could be. Perhaps use Pappy's
	toStamp() {
		const providedPathWithoutEndingSlash = this.scrollFolder.replace(/\/$/, "")
		const absPath = path.resolve(providedPathWithoutEndingSlash)

		return Disk.getFiles(absPath)
			.filter(file => file.endsWith(SCROLL_FILE_EXTENSION) || file.endsWith(SCROLL_SETTINGS_FILENAME))
			.map(
				path => `file ${path}
 data
  ${cleanAndRightShift(read(path), 2)}`
			)
			.join("\n")
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

	async createCommand(cwd) {
		const builder = new ScrollBuilder()
		const template = replaceAll(builder.toStamp(), builder.scrollFolder, "")
		this.log(`Creating scroll in "${cwd}"`)
		await new stamp(template).silence().execute(cwd)
		return this.log(`\n👍 Scroll created! Build your new site with: scroll build`)
	}

	deleteCommand() {
		return this.log(`\n💡 To delete a Scroll just delete the folder\n`)
	}

	async importCommand(cwd) {
		const builder = new ScrollBuilder(cwd)
		const result = await builder.importSite()
		return this.log(result)
	}

	// checkCommand(args) {
	// 	const folder = args[0]
	// 	if (!folder) this._exit(`Folder name must be provided`)
	// 	const fullPath = resolvePath(folder)
	// 	this._ensureScrollFolderExists(fullPath)
	// 	return this.log(new ScrollServer(fullPath).errors)
	// }

	// todo:
	// \[([^\]]+)\]\(([^\)]+)\) <a href="$2">$1</a>
	// \*\*([^\*]+)\*\* <strong>$1</strong>
	// \*([^\*]+)\* <em>$1</em>
	// `([^`]+)` <code>$1</code>
	// convertCommand(globPatterns) {
	// 	if (!globPatterns.length) return this.log(`\n💡 To convert markdown files to Scroll pass a glob pattern like this "scroll convert *.md"\n`)

	// 	const files = globPatterns.map(pattern => glob.sync(pattern)).flat()
	// 	this.log(`${files.length} files to convert`)
	// 	files.map(resolvePath).forEach(fullPath => write(fullPath, new MarkdownFile(read(fullPath)).toScroll()))
	// }

	async buildCommand(cwd) {
		const fullPath = resolvePath(cwd)

		if (!isScrollFolder(fullPath)) return this.log(`❌ Folder '${cwd}' has no '${SCROLL_SETTINGS_FILENAME}' file.`)

		const builder = new ScrollBuilder(fullPath)
		builder.verbose = this.verbose
		builder.writeSinglePages()
		builder.buildIndexPage()
		builder.startWatching()
		if (this.verbose) builder.openBrowser()
		return builder
	}

	helpCommand() {
		return this.log(`\nThis is the Scroll help page.\n\nCommands you can run from your Scroll's folder:\n\n${this._allCommands.map(comm => `🖌️ ` + comm.replace(CommandFnDecoratorSuffix, "")).join("\n")}\n​​`)
	}

	exportCommand(cwd) {
		const fullPath = resolvePath(cwd)
		if (!isScrollFolder(fullPath)) return this.log(`❌ Folder '${cwd}' has no '${SCROLL_SETTINGS_FILENAME}' file.`)
		return this.log(new ScrollBuilder(fullPath).toStamp())
	}
}

class MarkdownFile {
	constructor(markdown) {
		this.markdown = markdown
	}

	markdown = ""

	toScroll() {
		return this.markdown
	}
}

if (module && !module.parent) new ScrollCli().execute(parseArgs(process.argv.slice(2))._)

module.exports = { ScrollBuilder, ScrollCli, Article, MarkdownFile, SCROLL_SETTINGS_FILENAME }
