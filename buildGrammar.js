#!/usr/bin/env node

const { CommandLineApp } = require("jtree/products/commandLineApp.node.js")
const fs = require("fs")
const path = require("path")

const outputFilePath = path.join(__dirname, "scrolldown.grammar")
const grammarPath = path.join(__dirname, "grammar")

// Concatenate all files ending in ".grammar" in the "grammar" directory:
const grammar =
	`tooling A function generates this Scrolldown grammar by combining all files in the grammars folder.\n` +
	fs
		.readdirSync(grammarPath)
		.filter(file => file.endsWith(".grammar"))
		.map(file => fs.readFileSync(path.join(grammarPath, file), "utf8"))
		.join("\n")

// Write the concatenated grammar to "scrolldown.grammar":
fs.writeFileSync(outputFilePath, grammar)

// Format the file:
new CommandLineApp().format(outputFilePath)
