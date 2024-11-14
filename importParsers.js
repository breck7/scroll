#! /usr/bin/env node

const { Particle } = require("scrollsdk/products/Particle.js")
const path = require("path")
const fs = require("fs")
const code = fs.readFileSync(path.join("/Users/breck/sdk/langs/parsers/", "parsers.parsers"), "utf8")
const parsers = new Particle(code)
const toDelete = "parsersParser blankLineParser rootFlagParser commentLineParser slashCommentParser".split(" ")
toDelete.forEach(cue => parsers.getParticle(cue).destroy())
const done = parsers.toString().replace(" rootFlagParser ", " ")
fs.writeFileSync(path.join(__dirname, "parsers", "parsers.parsers"), done, "utf8")
