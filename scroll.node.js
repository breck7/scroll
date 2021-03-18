#! /usr/bin/env node

// NPM ecosystem includes
const parseArgs = require("minimist")
const glob = require("glob")
const express = require("express")
const path = require("path")
const fse = require("fs-extra")
const fs = require("fs")
const lodash = require("lodash")
const dayjs = require("dayjs")
const getPort = require("get-port")

// Tree Notation Includes
const { jtree } = require("jtree")
const { TreeNode } = jtree
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
const SCROLL_SETTINGS_FILENAME = "scrollSettings.map"

const scrollSrcFolder = __dirname + "/"
const exampleFolder = scrollSrcFolder + "example.com/"
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
	date: "date"
}

// Helper utils
const read = filename => fs.readFileSync(filename, "utf8")
const write = (filename, content) => fs.writeFileSync(filename, content, "utf8")
const resolvePath = (folder = "") => (folder.startsWith("/") ? folder : path.resolve(process.cwd() + "/" + folder))
const isScrollFolder = absPath => fs.existsSync(path.normalize(absPath + "/" + SCROLL_SETTINGS_FILENAME))
const replaceAll = (str, search, replace) => str.split(search).join(replace)

class Article {
	constructor(content = "", sourceLink = "") {
		this.content = content
		this.sourceLink = sourceLink
	}

	content = ""
	sourceLink = ""

	get scrollCompiler() {
		const grammarCode = [read(__dirname + "/scroll.grammar")].join("\n")

		const errs = new grammarNode(grammarCode).getAllErrors().map(err => err.toObject())
		if (errs.length) console.error(new jtree.TreeNode(errs).toFormattedTable(200))

		return new jtree.HandGrammarProgram(grammarCode).compileAndReturnRootConstructor()
	}

	get permalink() {
		return this.asTree.get(scrollKeywords.permalink) || path.basename(this.sourceLink).replace(/\.scroll$/, "")
	}

	get toScrollProgram() {
		return new this.scrollCompiler(this.content)
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

		node.getNode("div").appendLineAndChildren("bern", this.toScrollProgram.compile() + sourceLink)

		return new stump(node)
	}
}

class Scroll {
	constructor(stamp = "") {
		this.stamp = new TreeNode(stamp)
	}

	stamp = new TreeNode()

	// stamp sample file: https://jtree.treenotation.org/designer/#standard%20stamp
	get publishedArticles() {
		const all = this.stamp.filter(node => node.getLine().endsWith(SCROLL_FILE_EXTENSION)).map(node => new Article(node.getNode("data")?.childrenToString(), this.gitLink ? this.gitLink + path.basename(node.getWord(1)) : ""))
		return lodash.sortBy(all, article => article.timestamp).reverse()
	}

	get gitLink() {
		return this.settings.git + "/"
	}

	get errors() {
		return this.publishedArticles.map(article => article.toScrollProgram.getAllErrors())
	}

	get _settings() {
		return this.stamp
			.find(node => node.getLine().endsWith(SCROLL_SETTINGS_FILENAME))
			?.getNode("data")
			?.childrenToString()
	}

	get settings() {
		const defaults = {
			twitter: "",
			github: "",
			email: ""
		}

		return { ...defaults, ...new TreeNode(this._settings).toObject() }
	}

	// todo: refactor this. stump sucks. improve it.
	toSingleHtmlFile(articles = this.publishedArticles) {
		const scrollDotHakon = read(scrollSrcFolder + "scroll.hakon")
		const scrollDotStump = new TreeNode(read(scrollSrcFolder + "scroll.stump"))
		const scrollIcons = new TreeNode(read(scrollSrcFolder + "scrollIcons.map")).toObject()

		const userSettingsMap = { ...scrollIcons, ...this.settings }
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
}

class ScrollServer {
	constructor(scrollFolder = `${exampleFolder}`) {
		this.publicFolder = path.normalize(scrollFolder + "/")
	}

	verbose = true
	publicFolder = ""

	get settingsPath() {
		return this.publicFolder + SCROLL_SETTINGS_FILENAME
	}

	get scroll() {
		return new Scroll(this.toStamp())
	}

	log(message) {
		if (this.verbose) console.log(message)
		return message
	}

	previousVersion = ""

	singlePages = new Map()
	buildSinglePages() {
		return this.scroll.publishedArticles.map(article => {
			const permalink = `${article.permalink}.html`
			const content = this.scroll.toSingleHtmlFile([article])
			if (this.singlePages.get(permalink) === content) return "Unmodified"
			write(`${this.publicFolder}/${permalink}`, content)
			this.singlePages.set(permalink, content)
			return this.log(`Wrote ${permalink} to disk`)
		})
	}

	buildSaveAndServeSingleHtmlFile() {
		const file = this.scroll.toSingleHtmlFile()
		if (this.previousVersion !== file) {
			write(this.publicFolder + "/index.html", file)
			this.previousVersion = file
			this.log(`Wrote new index.html to disk`)
		}
		return file
	}

	get errors() {
		return this.scroll.errors
	}

	startListening(port) {
		const app = new express()

		app.get("/", (req, res) => {
			this.buildSinglePages()
			res.send(this.buildSaveAndServeSingleHtmlFile())
		})

		app.use(express.static(this.publicFolder))

		return app.listen(port, () => {
			this.log(`\nServing Scroll '${this.settingsPath}'

🤙 cmd+dblclick: http://localhost:${port}/`)
		})
	}

	// todo: current stamp sucks compared to what it could be. Perhaps use Pappy's
	toStamp() {
		const providedPathWithoutEndingSlash = this.publicFolder.replace(/\/$/, "")
		const absPath = path.resolve(providedPathWithoutEndingSlash)

		return Disk.getFiles(absPath)
			.filter(file => file.endsWith(SCROLL_FILE_EXTENSION) || file.endsWith(SCROLL_SETTINGS_FILENAME))
			.map(
				path => `file ${path}
 data
  ${read(path)
		.replace(/\r/g, "")
		.replace(/\n/g, "\n  ")}`
			)
			.join("\n")
	}
}

class MarkdownFile {
	constructor(content = "") {
		this.content = content
	}
	content = ""
	toDumbdown() {
		return this.content
			.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, `<a href="$2">$1</a>`)
			.replace(/\*\*([^\*]+)\*\*/g, `<strong>$1</strong>`)
			.replace(/\*([^\*]+)\*/g, `<em>$1</em>`)
			.replace(/\`([^`]+)\`/g, `<code>$1</code>`)
			.replace(/^###### /g, `title6 `)
			.replace(/^##### /g, `title5 `)
			.replace(/^#### /g, `title4 `)
			.replace(/^### /g, `title3 `)
			.replace(/^## /g, `title2 `)
	}
}

class ScrollCli {
	execute(args = []) {
		this.log(`\n📜📜📜 WELCOME TO SCROLL (v${SCROLL_VERSION}) 📜📜📜`)
		const command = args[0]
		const commandName = `${command}${CommandFnDecoratorSuffix}`
		const cwd = process.cwd()
		// Note: if we need 2 params, we are doing it wrong. At
		// that point, we'd be better off taking an options map.
		if (this[commandName]) return this[commandName](cwd)
		else if (isScrollFolder(cwd)) return this.serveCommand(cwd)

		if (!command) this.log(`No command provided and no '${SCROLL_SETTINGS_FILENAME}' found. Running help command.`)

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
		const server = new ScrollServer()
		const template = replaceAll(server.toStamp(), server.publicFolder, "")
		this.log(`Creating scroll in "${cwd}"`)
		await new stamp(template).execute(cwd)
		return this.log(`\n👍 Scroll created! To start serving run: scroll`)
	}

	deleteCommand() {
		return this.log(`\n💡 To delete a Scroll just delete the folder\n`)
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
	convertCommand(globPatterns) {
		if (!globPatterns.length) return this.log(`\n💡 To convert markdown files to dumbdown pass a glob pattern like this "scroll convert *.md"\n`)

		const files = globPatterns.map(pattern => glob.sync(pattern)).flat()
		this.log(`${files.length} files to convert`)
		files.map(resolvePath).forEach(fullPath => write(fullPath, new MarkdownFile(read(fullPath)).toDumbdown()))
	}

	async serveCommand(cwd) {
		const portNumber = await getPort({ port: getPort.makeRange(DEFAULT_PORT, DEFAULT_PORT + 100) })
		const fullPath = resolvePath(cwd)

		if (!isScrollFolder(fullPath)) return this.log(`❌ Folder '${cwd}' has no '${SCROLL_SETTINGS_FILENAME}' file.`)

		const scrollServer = new ScrollServer(fullPath)
		return scrollServer.startListening(portNumber)
	}

	helpCommand() {
		return this.log(`\nThis is the Scroll help page.\n\nCommands you can run from your Scroll's folder:\n\n${this._allCommands.map(comm => `🖌️ ` + comm.replace(CommandFnDecoratorSuffix, "")).join("\n")}\n​​`)
	}

	exportCommand(cwd) {
		const fullPath = resolvePath(cwd)
		if (!isScrollFolder(fullPath)) return this.log(`❌ Folder '${cwd}' has no '${SCROLL_SETTINGS_FILENAME}' file.`)
		return this.log(new ScrollServer(fullPath).toStamp())
	}
}

if (module && !module.parent) new ScrollCli().execute(parseArgs(process.argv.slice(2))._)

module.exports = { ScrollServer, ScrollCli, Scroll, Article, MarkdownFile, SCROLL_SETTINGS_FILENAME }
