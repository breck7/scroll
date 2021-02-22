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

// Tree Notation Includes
const { jtree } = require("jtree")
const { TreeNode } = jtree
const stamp = require("jtree/products/stamp.nodejs.js")
const hakon = require("jtree/products/hakon.nodejs.js")
const stump = require("jtree/products/stump.nodejs.js")
const grammarNode = require("jtree/products/grammar.nodejs.js")

// Constants
const scrollSrcFolder = __dirname + "/"
const exampleFolder = scrollSrcFolder + "example.com/"
const scrollSettingsFilename = "scrollSettings.map"
const CommandFnDecoratorSuffix = "Command"
const compiledMessage = `<!--

 This page was compiled by 📜 Scroll, the Dumbdown
 static site publishing software.
 
 https://github.com/treenotation/dumbdown
 
 Generally you don't want to edit it by hand.

-->`

const cssClasses = {
	scrollPage: "scrollPage",
	scrollArticleCell: "scrollArticleCell",
	scrollArticleSourceLink: "scrollArticleSourceLink"
}

// Helper utils
const read = filename => fs.readFileSync(filename, "utf8")
const write = (filename, content) => fs.writeFileSync(filename, content, "utf8")
const serveScrollHelp = (folder = "example.com") => `\n\nscroll serve ${folder} 1145\n\n`
const resolvePath = (folder = "") => (folder.startsWith("/") ? folder : path.resolve(process.cwd() + "/" + folder))
const isScrollFolder = absPath => fs.existsSync(path.normalize(absPath + "/" + scrollSettingsFilename))

class Article {
	constructor(content = "", sourceLink = "") {
		this.dumbdown = content
		this.sourceLink = sourceLink
	}

	dumbdown = ""
	sourceLink = ""

	get dumbdownCompiler() {
		const grammarCode = [read(__dirname + "/scroll.grammar")].join("\n")

		const errs = new grammarNode(grammarCode).getAllErrors().map(err => err.toObject())
		if (errs.length) console.error(new jtree.TreeNode(errs).toFormattedTable(200))

		return new jtree.HandGrammarProgram(grammarCode).compileAndReturnRootConstructor()
	}

	get toDumbdownProgram() {
		return new this.dumbdownCompiler(this.dumbdown)
	}

	get timestamp() {
		return dayjs(new TreeNode(this.dumbdown).get("date") ?? 0).unix()
	}

	toStumpNode() {
		const node = new TreeNode(`div
 class ${cssClasses.scrollArticleCell}`)

		const sourceLink = this.sourceLink ? `<p class="${cssClasses.scrollArticleSourceLink}"><a href="${this.sourceLink}">Article source</a></p>` : ""

		node.getNode("div").appendLineAndChildren("bern", this.toDumbdownProgram.compile() + sourceLink)

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
		const all = this.stamp.filter(node => node.getLine().endsWith(".dd")).map(node => new Article(node.getNode("data")?.childrenToString(), this.gitLink ? this.gitLink + path.basename(node.getWord(1)) : ""))
		return lodash.sortBy(all, article => article.timestamp).reverse()
	}

	get gitLink() {
		return this.settings.git + "/"
	}

	get errors() {
		return this.publishedArticles.map(article => article.toDumbdownProgram.getAllErrors())
	}

	get _settings() {
		return this.stamp
			.find(node => node.getLine().endsWith(scrollSettingsFilename))
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

	toSingleHtmlFile() {
		const scrollDotHakon = read(scrollSrcFolder + "scroll.hakon")
		const scrollDotStump = new TreeNode(read(scrollSrcFolder + "scroll.stump"))
		const scrollIcons = new TreeNode(read(scrollSrcFolder + "scrollIcons.map")).toObject()

		const userSettingsMap = { ...scrollIcons, ...this.settings }
		const stumpWithSettings = new TreeNode(scrollDotStump.templateToString(userSettingsMap)).expandLastFromTopMatter()

		stumpWithSettings
			.getTopDownArray()
			.filter(node => node.getLine() === `class ${cssClasses.scrollPage}`)[0]
			.getParent() // todo: fix
			.setChildren(`class ${cssClasses.scrollPage}\n` + this.publishedArticles.map(article => article.toStumpNode().toString()).join("\n"))

		const stumpNode = new stump(stumpWithSettings)
		const styleTag = stumpNode.getNode("head styleTag")
		styleTag.appendLineAndChildren("bern", new hakon(scrollDotHakon).compile())
		return compiledMessage + "\n" + stumpNode.compile()
	}
}

class ScrollServer {
	constructor(scrollFolder = `${exampleFolder}`) {
		this.publicFolder = path.normalize(scrollFolder + "/")
	}

	verbose = true
	publicFolder = ""

	get settingsPath() {
		return this.publicFolder + scrollSettingsFilename
	}

	get scroll() {
		return new Scroll(this.toStamp())
	}

	log(message) {
		if (this.verbose) console.log(message)
		return message
	}

	previousVersion = ""

	buildSaveAndServeSingleHtmlFile() {
		const file = this.scroll.toSingleHtmlFile()
		if (this.previousVersion !== file) {
			write(this.publicFolder + "/index.html", file)
			this.previousVersion = file
			this.log(`Wrote new index.html to disk`)
		}
		return file
	}

	get errrors() {
		return this.scroll.errors
	}

	startListening(port) {
		const app = new express()

		app.get("/", (req, res) => res.send(this.buildSaveAndServeSingleHtmlFile()))

		app.use(express.static(this.publicFolder))

		return app.listen(port, () => {
			this.log(`\nServing Scroll '${this.settingsPath}'

🤙 cmd+dblclick: http://localhost:${port}/`)
		})
	}

	toStamp() {
		const providedPathWithoutEndingSlash = this.publicFolder.replace(/\/$/, "")
		const absPath = path.resolve(providedPathWithoutEndingSlash)
		return stamp.dirToStampWithContents(absPath)
	}
}

class ScrollCli {
	execute(args = []) {
		this.log("\n📜📜📜 WELCOME TO SCROLL 📜📜📜")
		const command = args[0]
		const commandName = `${command}${CommandFnDecoratorSuffix}`
		// Note: if we need a param3, we are doing it wrong. At
		// that point, we'd be better off taking an options map.
		if (this[commandName]) return this[commandName](args.slice(1))
		else if (isScrollFolder(process.cwd())) return this.serveCommand(1145, process.cwd())

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

	_exit(message) {
		this.log(`\n❌ ${message}\n`)
		process.exit()
	}

	_ensureScrollFolderExists(folder) {
		if (!fs.existsSync(folder)) this._exit(`No Scroll exists in folder ${folder}`)
	}

	async createCommand(args) {
		if (!args.length) this._exit(`Usage "scroll create foo.com bar.com"`)
		return args.map(async destinationFolderName => {
			const template = new ScrollServer().toStamp().replace(/example.com/g, destinationFolderName)
			this.log(`Creating scroll in "${destinationFolderName}"`)
			await new stamp(template).execute()
			return this.log(`\n👍 Scroll created! Now you can run:${serveScrollHelp(destinationFolderName)}`)
		})
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
	// 	if (!globPatterns.length) return this.log(`\n💡 To convert markdown files to dumbdown pass a glob pattern like this "scroll convert *.md"\n`)

	// 	const files = globPatterns.map(pattern => glob.sync(pattern)).flat()
	// 	this.log(`${files.length} files to convert`)
	// 	files.map(resolvePath).forEach(fullPath => write(fullPath, new MarkdownFile(read(fullPath)).toDumbdown()))
	// }

	serveCommand(args) {
		let folder = process.cwd()
		let portNumber = 1145
		const [param1, param2] = args

		// Overloads:
		// "serve" => serve cwd on default port
		// "serve 123" => serve cwd on custom port
		// "serve folderName" => serve on default port
		// "serve folderName 232" => serve on custom port
		if (param1 && param1.match(/[^\d]/)) folder = param1
		else if (param1) portNumber = param1

		if (param2) portNumber = param2

		if (!portNumber) this._exit(`Port must be provided. Usage:${serveScrollHelp()}`)
		if (!folder) this._exit(`Folder name must be provided. Usage:${serveScrollHelp()}`)
		const fullPath = resolvePath(folder)
		this._ensureScrollFolderExists(fullPath)

		if (!isScrollFolder(fullPath)) this._exit(`Folder missing a '${scrollSettingsFilename}' file.`)

		const scrollServer = new ScrollServer(fullPath)
		return scrollServer.startListening(portNumber)
	}

	helpCommand() {
		return this.log(`\nThis is the Scroll help page.\nAvailable commands are:\n\n${this._allCommands.map(comm => `🖌️ ` + comm.replace(CommandFnDecoratorSuffix, "")).join("\n")}\n​​`)
	}

	exportCommand(args) {
		if (!args.length) this._exit(`Usage "scroll export foo.com bar.com"`)
		return args.map(scrollFolderName => {
			const fullPath = resolvePath(scrollFolderName)
			this._ensureScrollFolderExists(fullPath)
			return this.log(new ScrollServer(fullPath).toStamp())
		})
	}
}

class MarkdownFile {
	constructor(markdown) {
		this.markdown = markdown
	}

	markdown = ""

	toDumbdown() {
		return this.markdown
	}
}

if (module && !module.parent) new ScrollCli().execute(parseArgs(process.argv.slice(2))._)

module.exports = { ScrollServer, ScrollCli, Scroll, Article, MarkdownFile }
