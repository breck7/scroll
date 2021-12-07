#!/usr/bin/env node

const outputFilePath = __dirname + "/scrolldown.grammar"

// use fs:
const fs = require("fs")

// Concatenate all files ending in ".grammar" in the "grammar" directory:
const grammar =
	`tooling A function generates this Scrolldown grammar by combining all files in the grammars folder.\n` +
	fs
		.readdirSync("./grammar")
		.filter(file => file.endsWith(".grammar"))
		.map(file => fs.readFileSync("./grammar/" + file, "utf8"))
		.join("\n")

// Write the concatenated grammar to "scrolldown.grammar":
fs.writeFileSync(outputFilePath, grammar)

// Format the file:
const { CommandLineApp } = require("jtree/products/commandLineApp.node.js")
new CommandLineApp().format(outputFilePath)
