#! /usr/bin/env node

const { GrammarCompiler } = require("scrollsdk/products/GrammarCompiler.js")
const { Disk } = require("scrollsdk/products/Disk.node.js")
const path = require("path")

const folder = path.join(__dirname, "parsers")

Disk.getFullPaths(folder)
  .filter(filePath => filePath.endsWith(".parsers"))
  .forEach(filePath => GrammarCompiler.formatFileInPlace(filePath, "/Users/breck/scrollsdk/langs/grammar/grammar.grammar")) // todo: get path to node_modules grammar file so this will work on anyones machine
