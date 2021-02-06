#! /usr/bin/env node

const minimist = require("minimist")
const express = require("express")
const { DudBlog } = require("./dudBlog.js")
const fse = require("fs-extra")

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
			console.log(`Running Dud. cmd+dblclick: http://localhost:${port}/`)
		})
	}
}

class DudCli {
	execute(argv) {
		console.log("Welcome to Dud.")
		const command = argv[0]
		if (this[command]) this[command](argv[1])
		else this.showCommandsCommand()
	}

	startExpressServerCommand(portNumber = 1145) {
		const server = new DudServer()
		server.startListening(portNumber)
	}

	showCommandsCommand() {
		console.log("startExpressServerCommand")
	}
}

if (module && !module.parent) new DudCli().execute(process.argv.slice(2))

module.exports = { DudServer, DudCli }
