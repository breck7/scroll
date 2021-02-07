#! /usr/bin/env node

const minimist = require("minimist")
const express = require("express")
const path = require("path")
const stamp = require("jtree/products/stamp.nodejs.js")
const fse = require("fs-extra")

class DudPage {
	isDraft() {}
}

class DudBlog {
	constructor() {}
	fromHtmlStamp() {}
	toHtmlStamp() {}

	get publishedPages() {}
}

class DudServer {
	constructor(blogFolder = __dirname + "/sampleBlog") {
		this.folder = blogFolder
	}

	folder = ""

	get filesFolder() {
		return this.folder + "/files"
	}

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

class DudCli {
	execute(argv) {
		console.log("🚀🚀🚀 WELCOME TO DUD 🚀🚀🚀")
		const command = argv[0]
		const commandName = `${command}${CommandFnDecoratorSuffix}`
		if (this[commandName]) this[commandName](argv[1])
		else this.helpCommand()
	}

	_getAllCommands() {
		return Object.getOwnPropertyNames(Object.getPrototypeOf(this))
			.filter(word => word.endsWith(CommandFnDecoratorSuffix))
			.sort()
	}

	createBlogCommand(destinationFolderName = `new-blog-${Date.now()}`) {
		const template = new DudServer().toStamp().replace(/sampleBlog/g, destinationFolderName)
		new stamp(template).execute()
	}

	startPreviewServerCommand(portNumber = 1145) {
		const server = new DudServer()
		server.startListening(portNumber)
	}

	helpCommand() {
		console.log(
			`\nThis is the Dud help page.\n\nAvailable commands are:\n\n${this._getAllCommands()
				.map(comm => `🏀 ` + comm.replace(CommandFnDecoratorSuffix, ""))
				.join("\n")}\n​​`
		)
	}

	exportBlogCommand(dir) {
		console.log(new DudServer(dir).toStamp())
	}
}

if (module && !module.parent) new DudCli().execute(process.argv.slice(2))

module.exports = { DudServer, DudCli, DudBlog }
