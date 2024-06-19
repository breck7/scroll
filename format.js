#! /usr/bin/env node

const { ParsersCompiler } = require("scrollsdk/products/ParsersCompiler.js")
const { Disk } = require("scrollsdk/products/Disk.node.js")
const path = require("path")

const folder = path.join(__dirname, "parsers")

Disk.getFullPaths(folder)
  .filter(filePath => filePath.endsWith(".parsers"))
  .forEach(filePath => ParsersCompiler.formatFileInPlace(filePath, "/Users/breck/scrollsdk/langs/parsers/parsers.parsers")) // todo: get path to node_modules parsers file so this will work on anyones machine
