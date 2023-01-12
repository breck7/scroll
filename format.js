#! /usr/bin/env node

const { GrammarCompiler } = require("jtree/products/GrammarCompiler.js")
const { Disk } = require("jtree/products/Disk.node.js")
const path = require("path")

const folder = path.join(__dirname, "grammar")

Disk.getFullPaths(folder)
	.filter(filePath => filePath.endsWith(".grammar"))
	.forEach(filePath => GrammarCompiler.formatFileInPlace(filePath, "/Users/breck/jtree/langs/grammar/grammar.grammar")) // todo: get path to node_modules grammar file so this will work on anyones machine
