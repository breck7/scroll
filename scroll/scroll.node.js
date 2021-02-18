#! /usr/bin/env node

const minimist = require("minimist")
const express = require("express")
const path = require("path")
const fse = require("fs-extra")
const fs = require("fs")

const { jtree } = require("jtree")
const { TreeNode } = jtree
const stamp = require("jtree/products/stamp.nodejs.js")
const hakon = require("jtree/products/hakon.nodejs.js")
const stump = require("jtree/products/stump.nodejs.js")
const dumbdown = require("jtree/products/dumbdown.nodejs.js")

const read = filename => fs.readFileSync(filename, "utf8")

const compiledMessage = `<!--

 This page was compiled by 📜 Scroll, the Dumbdown
 static site publishing software.
 
 https://github.com/treenotation/dumbdown
 
 Generally you don't want to edit it by hand.

-->`

const scrollSrcFolder = __dirname + "/"
const exampleFolder = scrollSrcFolder + "../example.com/"

class Article {
	constructor(stampNode) {
		this.dumbdown = stampNode.getNode("data")?.childrenToString()
		this.filename = stampNode.getWord(1)
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

	isValidScroll() {
		return !!this._settings
	}

	// stamp sample file: https://jtree.treenotation.org/designer/#standard%20stamp
	get publishedArticles() {
		return this.stamp
			.filter(node => node.getLine().includes("published")) // search the published folder
			.filter(node => node.getLine().endsWith(".dd"))
			.map(node => new Article(node))
	}

	get _settings() {
		return this.stamp
			.find(node => node.getLine().endsWith(".map"))
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
}

class ScrollServer {
	constructor(scrollFolder = `${exampleFolder}`) {
		this.folder = scrollFolder
	}

	folder = ""

	get publishedFolder() {
		return this.folder + "/published/"
	}

	get settingsPath() {
		return this.publishedFolder + "settings.map"
	}

	startWatchingScrollFolder() {}

	startListening(port) {
		const app = new express()

		app.get("/", (req, res) => res.send(new Scroll(this.toStamp()).toSingleHtmlFile()))

		app.use(express.static(this.publishedFolder))

		app.listen(port, () => {
			console.log(`\nServing '${this.publishedFolder}'.
Settings path is '${this.settingsPath}

🤙 cmd+dblclick: http://localhost:${port}/`)
		})
	}

	toStamp() {
		const providedPathWithoutEndingSlash = this.folder.replace(/\/$/, "")
		const absPath = path.resolve(providedPathWithoutEndingSlash)
		return stamp.dirToStampWithContents(absPath)
	}
}

const CommandFnDecoratorSuffix = "Command"

const serveScrollHelp = (folder = "example.com") => `\n\nscroll serve 1145 ${folder}\n\n`

const resolvePath = (folder = "") => (folder.startsWith("/") ? folder : path.resolve(process.cwd() + "/" + folder))

const isScrollFolder = absPath => new Scroll(stamp.dirToStampWithContents(absPath)).isValidScroll()

class ScrollCli {
	execute(argv) {
		console.log("\n📜📜📜 WELCOME TO SCROLL 📜📜📜")
		const command = argv[0]
		const commandName = `${command}${CommandFnDecoratorSuffix}`
		const param1 = argv[1]
		const param2 = argv[2]
		// Note: if we need a param3, we are doing it wrong. At
		// that point, we'd be better off taking an options map.
		if (this[commandName]) this[commandName](param1, param2)
		else if (isScrollFolder(process.cwd())) this.serveCommand(1145, process.cwd())
		else this.helpCommand()
	}

	_getAllCommands() {
		return Object.getOwnPropertyNames(Object.getPrototypeOf(this))
			.filter(word => word.endsWith(CommandFnDecoratorSuffix))
			.sort()
	}

	async createCommand(destinationFolderName = `scroll-${Date.now()}`) {
		const template = new ScrollServer().toStamp().replace(/example.com/g, destinationFolderName)
		console.log(`Creating scroll in "${destinationFolderName}"`)
		await new stamp(template).execute()
		console.log(`\n👍 Scroll created! Now you can run:${serveScrollHelp(destinationFolderName)}`)
	}

	_exit(message) {
		console.log(`\n❌ ${message}\n`)
		process.exit()
	}

	_ensureScrollFolderExists(folder) {
		if (!fs.existsSync(folder)) this._exit(`No Scroll exists in folder ${folder}`)
	}

	deleteCommand() {
		console.log(`\n💡 To delete a Scroll just delete the folder\n`)
	}

	serveCommand(portNumber, folder) {
		if (!portNumber) this._exit(`Port must be provided. Usage:${serveScrollHelp()}`)
		if (!folder) this._exit(`Folder name must be provided. Usage:${serveScrollHelp()}`)
		const fullPath = resolvePath(folder)
		this._ensureScrollFolderExists(fullPath)
		const server = new ScrollServer(fullPath)
		server.startListening(portNumber)
	}

	helpCommand() {
		console.log(
			`\nThis is the Scroll help page.\nAvailable commands are:\n\n${this._getAllCommands()
				.map(comm => `🖌️ ` + comm.replace(CommandFnDecoratorSuffix, ""))
				.join("\n")}\n​​`
		)
	}

	exportCommand(folder) {
		if (!folder) this._exit(`Folder name must be provided`)
		const fullPath = resolvePath(folder)
		this._ensureScrollFolderExists(fullPath)
		console.log(new ScrollServer(fullPath).toStamp())
	}
}

if (module && !module.parent) new ScrollCli().execute(process.argv.slice(2))

module.exports = { ScrollServer, ScrollCli, Scroll }
