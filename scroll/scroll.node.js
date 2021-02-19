#! /usr/bin/env node

// NPM ecosystem includes
const minimist = require("minimist")
const express = require("express")
const path = require("path")
const fse = require("fs-extra")
const fs = require("fs")

// Tree Notation Includes
const { jtree } = require("jtree")
const { TreeNode } = jtree
const stamp = require("jtree/products/stamp.nodejs.js")
const hakon = require("jtree/products/hakon.nodejs.js")
const stump = require("jtree/products/stump.nodejs.js")
const dumbdown = require("jtree/products/dumbdown.nodejs.js")

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

// Helper utils
const read = filename => fs.readFileSync(filename, "utf8")
const serveScrollHelp = (folder = "example.com") => `\n\nscroll serve ${folder} 1145\n\n`
const resolvePath = (folder = "") => (folder.startsWith("/") ? folder : path.resolve(process.cwd() + "/" + folder))
const isScrollFolder = absPath => fs.existsSync(path.normalize(absPath + "/" + scrollSettingsFilename))

class Article {
	constructor(filename = "", content = "") {
		this.filename = filename
		this.dumbdown = content
	}

	filename = ""
	dumbdown = ""

	get _anchorName() {
		return this.filename
			.split("/")
			.pop()
			.replace(".dd", "")
	}

	toStumpNode() {
		const node = new TreeNode(`div
 id ${this._anchorName}
 class articleCell`)

		node.getNode("div").appendLineAndChildren("bern", new dumbdown(this.dumbdown).compile())

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
		return this.stamp.filter(node => node.getLine().endsWith(".dd")).map(node => new Article(node.getWord(1), node.getNode("data")?.childrenToString()))
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
			.filter(node => node.getLine() === "class page")[0]
			.getParent() // todo: fix
			.setChildren(`class page\n` + this.publishedArticles.map(article => article.toStumpNode().toString()).join("\n"))

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

	startListening(port) {
		const app = new express()

		app.get("/", (req, res) => res.send(this.scroll.toSingleHtmlFile()))

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
	execute(argv = []) {
		this.log("\n📜📜📜 WELCOME TO SCROLL 📜📜📜")
		const command = argv[0]
		const param1 = argv[1]
		const param2 = argv[2]
		const commandName = `${command}${CommandFnDecoratorSuffix}`
		// Note: if we need a param3, we are doing it wrong. At
		// that point, we'd be better off taking an options map.
		if (this[commandName]) return this[commandName](param1, param2)
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
		console.log(`\n❌ ${message}\n`)
		process.exit()
	}

	_ensureScrollFolderExists(folder) {
		if (!fs.existsSync(folder)) this._exit(`No Scroll exists in folder ${folder}`)
	}

	async createCommand(destinationFolderName = `scroll-${Date.now()}`) {
		const template = new ScrollServer().toStamp().replace(/example.com/g, destinationFolderName)
		console.log(`Creating scroll in "${destinationFolderName}"`)
		await new stamp(template).execute()
		console.log(`\n👍 Scroll created! Now you can run:${serveScrollHelp(destinationFolderName)}`)
	}

	deleteCommand() {
		return this.log(`\n💡 To delete a Scroll just delete the folder\n`)
	}

	serveCommand(param1, param2) {
		let folder = process.cwd()
		let portNumber = 1145

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

	exportCommand(folder) {
		if (!folder) this._exit(`Folder name must be provided`)
		const fullPath = resolvePath(folder)
		this._ensureScrollFolderExists(fullPath)
		return this.log(new ScrollServer(fullPath).toStamp())
	}
}

if (module && !module.parent) new ScrollCli().execute(process.argv.slice(2))

module.exports = { ScrollServer, ScrollCli, Scroll, Article }
