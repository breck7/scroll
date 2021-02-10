#! /usr/bin/env node

const minimist = require("minimist")
const express = require("express")
const path = require("path")
const stamp = require("jtree/products/stamp.nodejs.js")
const fse = require("fs-extra")
const fs = require("fs")

class Dud {
	constructor(stamp = "") {}
	toSingleHtmlFile() {}
}

class DudServer {
	constructor(dudFolder = __dirname + "/sampleDud") {
		this.folder = dudFolder
	}

	folder = ""

	get filesFolder() {
		return this.folder + "/files"
	}

	startWatchingDudFolder() {}

	startListening(port) {
		const app = new express()

		app.use(express.static(this.filesFolder))

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

const serveDudHelp = (folder = "example.com") => `\n\ndud serveDud ${folder} 8080\n\n`

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

	async createDudCommand(destinationFolderName = `dud-${Date.now()}`) {
		const template = new DudServer().toStamp().replace(/sampleDud/g, destinationFolderName)
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

	deleteDudCommand() {
		console.log(`\n💡 To delete a dud just use the "rm" tool\n`)
	}

	serveDudCommand(folder, portNumber) {
		if (!folder || !portNumber) this._exit(`Folder name and port must be provided. Usage:${serveDudHelp()}`)
		const fullPath = resolvePath(folder)
		this._ensureDudExists(fullPath)
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

	exportDudCommand(folder) {
		if (!folder) this._exit(`Folder name must be provided`)
		const fullPath = resolvePath(folder)
		this._ensureDudExists(fullPath)
		console.log(new DudServer(fullPath).toStamp())
	}
}

if (module && !module.parent) new DudCli().execute(process.argv.slice(2))

module.exports = { DudServer, DudCli, Dud }
