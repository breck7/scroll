#! /usr/bin/env node

const minimist = require("minimist")
const express = require("express")
const path = require("path")
const stamp = require("jtree/products/stamp.nodejs.js")
const hakon = require("jtree/products/hakon.nodejs.js")
const stump = require("jtree/products/stump.nodejs.js")
const { jtree } = require("jtree")
const { TreeNode } = jtree
const fse = require("fs-extra")
const fs = require("fs")

const read = filename => fs.readFileSync(filename, "utf8")

const compiledMessage = `<!--

 This page was compiled by Dud, the Dumbdown
 static site publishing software.
 
 https://github.com/treenotation/dumbdown
 
 Generally you don't want to edit it by hand.

-->`

class Dud {
	constructor(stamp = "") {
		this.stamp = new TreeNode(stamp)
	}
	stamp = new TreeNode()
	toSingleHtmlFile() {
		const hakonProgram = read(__dirname + "/dud.hakon")
		const icons = new TreeNode(read(__dirname + "/dudIcons.map")).toObject()
		const varMap = { ...icons, ...this.settings }
		const stumpProgram = new TreeNode(read(__dirname + "/dud.stump")).templateToString(varMap)

		const stumpNode = new stump(stumpProgram)
		stumpNode.getNode("html head styleTag").appendLineAndChildren("bern", new hakon(hakonProgram).compile())
		return compiledMessage + "\n" + stumpNode.compile()
	}

	get settings() {
		const settingsCode = this.stamp
			.find(node => node.getLine().endsWith(".map"))
			?.getNode("data")
			?.childrenToString()

		return new TreeNode(settingsCode).toObject()
	}
}

class DudServer {
	constructor(dudFolder = `${__dirname}/example.com`) {
		this.folder = dudFolder
	}

	folder = ""

	startWatchingDudFolder() {}

	startListening(port) {
		const app = new express()

		app.get("/", (req, res) => res.send(new Dud(this.toStamp()).toSingleHtmlFile()))

		app.use(express.static(this.folder))

		app.listen(port, () => {
			console.log(`\n🌌 ​Running Dud. cmd+dblclick: http://localhost:${port}/`)
		})
	}

	toStamp() {
		const providedPathWithoutEndingSlash = this.folder.replace(/\/$/, "")
		const absPath = path.resolve(providedPathWithoutEndingSlash)
		return stamp.dirToStampWithContents(absPath)
	}
}

const CommandFnDecoratorSuffix = "Command"

const serveDudHelp = (folder = "example.com") => `\n\ndud serve ${folder} 8080\n\n`

const resolvePath = (folder = "") => (folder.startsWith("/") ? folder : path.resolve(__dirname + "/" + folder))

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

	serveCommand(folder, portNumber) {
		if (!folder) this._exit(`Folder name must be provided. Usage:${serveDudHelp()}`)
		if (!portNumber) this._exit(`Port must be provided. Usage:${serveDudHelp()}`)
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
