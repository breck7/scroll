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

 This page was compiled by Dud, the Dumbdown
 static site publishing software.
 
 https://github.com/treenotation/dumbdown
 
 Generally you don't want to edit it by hand.

-->`

const dudSrcFolder = __dirname + "/"
const exampleFolder = dudSrcFolder + "../example.com/"

class Article {
	constructor(stampNode) {
		this.dumbdown = stampNode.getNode("data")?.childrenToString()
		this.filename = stampNode.getWord(1)
	}
	filename = ""
	dumbdown = ""
	toStumpNode() {
		const node = new TreeNode(`div
 class articleCell`)

		node.getNode("div").appendLineAndChildren("bern", new dumbdown(this.dumbdown).compile())

		return new stump(node)
	}
}

class Dud {
	constructor(stamp = "") {
		this.stamp = new TreeNode(stamp)
	}
	stamp = new TreeNode()
	toSingleHtmlFile() {
		const dudDotHakon = read(dudSrcFolder + "dud.hakon")
		const dudDotStump = new TreeNode(read(dudSrcFolder + "dud.stump"))
		const dudIcons = new TreeNode(read(dudSrcFolder + "dudIcons.map")).toObject()

		const userSettingsMap = { ...dudIcons, ...this.settings }
		const stumpWithSettings = new TreeNode(dudDotStump.templateToString(userSettingsMap)).expandLastFromTopMatter()

		stumpWithSettings
			.getTopDownArray()
			.filter(node => node.getLine() === "class page")[0]
			.getParent() // todo: fix
			.setChildren(`class page\n` + this.publishedArticles.map(article => article.toStumpNode().toString()).join("\n"))

		const stumpNode = new stump(stumpWithSettings)
		const styleTag = stumpNode.getNode("head styleTag")
		styleTag.appendLineAndChildren("bern", new hakon(dudDotHakon).compile())
		return compiledMessage + "\n" + stumpNode.compile()
	}

	isValidDud() {
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

class DudServer {
	constructor(dudFolder = `${exampleFolder}`) {
		this.folder = dudFolder
	}

	folder = ""

	get publishedFolder() {
		return this.folder + "/published/"
	}

	get settingsPath() {
		return this.folder + "/settings.map"
	}

	startWatchingDudFolder() {}

	startListening(port) {
		const app = new express()

		app.get("/", (req, res) => res.send(new Dud(this.toStamp()).toSingleHtmlFile()))

		app.use(express.static(this.publishedFolder))

		app.listen(port, () => {
			console.log(`\n🌌 Serving '${this.publishedFolder}'.

Settings path is '${this.settingsPath}

cmd+dblclick: http://localhost:${port}/`)
		})
	}

	toStamp() {
		const providedPathWithoutEndingSlash = this.folder.replace(/\/$/, "")
		const absPath = path.resolve(providedPathWithoutEndingSlash)
		return stamp.dirToStampWithContents(absPath)
	}
}

const CommandFnDecoratorSuffix = "Command"

const serveDudHelp = (folder = "example.com") => `\n\ndud serve 1145 ${folder}\n\n`

const resolvePath = (folder = "") => (folder.startsWith("/") ? folder : path.resolve(__dirname + "/" + folder))

const isDudFolder = absPath => new Dud(stamp.dirToStampWithContents(absPath)).isValidDud()

class DudCli {
	execute(argv) {
		console.log("\n🚀🚀🚀 WELCOME TO DUD 🚀🚀🚀")
		const command = argv[0]
		const commandName = `${command}${CommandFnDecoratorSuffix}`
		const param1 = argv[1]
		const param2 = argv[2]
		// Note: if we need a param3, we are doing it wrong. At
		// that point, we'd be better off taking an options map.
		if (this[commandName]) this[commandName](param1, param2)
		else if (isDudFolder(process.cwd())) this.serveCommand(1145, process.cwd())
		else this.helpCommand()
	}

	_getAllCommands() {
		return Object.getOwnPropertyNames(Object.getPrototypeOf(this))
			.filter(word => word.endsWith(CommandFnDecoratorSuffix))
			.sort()
	}

	async createCommand(destinationFolderName = `dud-${Date.now()}`) {
		const template = new DudServer().toStamp().replace(/example.com/g, destinationFolderName)
		await new stamp(template).execute()
		console.log(`\n🎆 Dud created! Now you can run:${serveDudHelp(destinationFolderName)}`)
	}

	_exit(message) {
		console.log(`\n❌ ${message}\n`)
		process.exit()
	}

	_ensureDudFolderExists(folder) {
		if (!fs.existsSync(folder)) this._exit(`No dud exists in folder ${folder}`)
	}

	deleteCommand() {
		console.log(`\n💡 To delete a dud just use the "rm" tool\n`)
	}

	serveCommand(portNumber, folder) {
		if (!portNumber) this._exit(`Port must be provided. Usage:${serveDudHelp()}`)
		if (!folder) this._exit(`Folder name must be provided. Usage:${serveDudHelp()}`)
		const fullPath = resolvePath(folder)
		this._ensureDudFolderExists(fullPath)
		const server = new DudServer(fullPath)
		server.startListening(portNumber)
	}

	helpCommand() {
		console.log(
			`\nThis is the Dud help page.\n\nAvailable commands are:\n\n${this._getAllCommands()
				.map(comm => `🏀 ` + comm.replace(CommandFnDecoratorSuffix, ""))
				.join("\n")}\n​​`
		)
	}

	exportCommand(folder) {
		if (!folder) this._exit(`Folder name must be provided`)
		const fullPath = resolvePath(folder)
		this._ensureDudFolderExists(fullPath)
		console.log(new DudServer(fullPath).toStamp())
	}
}

if (module && !module.parent) new DudCli().execute(process.argv.slice(2))

module.exports = { DudServer, DudCli, Dud }
