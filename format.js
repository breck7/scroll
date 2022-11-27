#! /usr/bin/env node

const { jtree } = require("jtree")
const { Disk } = require("jtree/products/Disk.node.js")
const path = require("path")

const folder = path.join(__dirname, "grammar")

Disk.getFullPaths(folder)
	.filter(filePath => filePath.endsWith(".grammar"))
	.forEach(filePath => jtree.formatFileInPlace(filePath, "/Users/breck/jtree/langs/grammar/grammar.grammar"))
