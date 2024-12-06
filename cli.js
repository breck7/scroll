#! /usr/bin/env node
const parseArgs = require("minimist")
const { ScrollCli } = require("./scroll.js")

if (module && !module.parent) new ScrollCli().executeUsersInstructionsFromShell(parseArgs(process.argv.slice(2))._)
