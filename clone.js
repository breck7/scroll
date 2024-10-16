#! /usr/bin/env node

// NPM ecosystem includes
const parseArgs = require("minimist")
const path = require("path")
const fs = require("fs")
const os = require("os")
const { spawn } = require("child_process")

// Particles Includes
const { Disk } = require("scrollsdk/products/Disk.node.js")
const { Particle } = require("scrollsdk/products/Particle.js")
const { ScrollCli, ScrollFile, ScrollFileSystem, SimpleCLI } = require("./scroll.js")
const packageJson = require("./package.json")

class CloneCli extends SimpleCLI {
  welcomeMessage = `\n👯 WELCOME TO CLONE`

  async cloneCommand(cwd, urls) {
    for (const gitUrl of urls) {
      const protocolPrefix = gitUrl.startsWith("http") ? "" : "https://"
      const url = new URL(protocolPrefix + gitUrl)
      const { hostname, pathname } = url
      let cloneUrl = protocolPrefix + gitUrl
      let folderName = pathname
        .split("/")
        .pop()
        .replace(/\.git$/, "")
      if (pathname.length < 2) {
        // Allow cloning of domains like: clone capitaldb.togger.com
        folderName = hostname
        cloneUrl = url + hostname
      }
      cloneUrl = cloneUrl.replace(/\.git$/, "") + ".git"
      const cloneCommand = `git clone ${cloneUrl} ${folderName}`
      console.log(`Running: ${cloneCommand}`)

      const cloneProcess = spawn("git", ["clone", cloneUrl, folderName], { cwd })

      cloneProcess.stdout.on("data", data => {
        process.stdout.write(data.toString())
      })

      cloneProcess.stderr.on("data", data => {
        process.stderr.write(data.toString())
      })

      cloneProcess.on("close", async code => {
        if (code === 0) {
          console.log(`Cloned successfully into ${folderName}`)
          const scrollCli = new ScrollCli()
          await scrollCli.buildCommand(path.join(cwd, folderName))
        } else {
          console.error(`git clone failed with code ${code}`)
        }
      })
    }
  }
}

if (module && !module.parent) new CloneCli().cloneCommand(process.cwd(), parseArgs(process.argv.slice(2))._)

module.exports = { CloneCli }
