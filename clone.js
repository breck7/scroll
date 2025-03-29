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
const { ScrollCli, SimpleCLI } = require("./scroll.js")
const packageJson = require("./package.json")

class CloneCli extends SimpleCLI {
  welcomeMessage = `\n👯 WELCOME TO CLONE`

  clone(cwd, gitUrl, folderName) {
    return new Promise((resolve, reject) => {
      const protocolPrefix = gitUrl.startsWith("http") ? "" : "https://"
      const url = new URL(protocolPrefix + gitUrl)
      const { hostname, pathname } = url

      if (!folderName) {
        folderName = pathname
          .split("/")
          .pop()
          .replace(/\.git$/, "")
        if (pathname.length < 2) folderName = hostname
      }

      // Allow cloning of domains like: clone capitaldb.togger.com
      let cloneUrl = protocolPrefix + gitUrl
      if (pathname.length < 2) cloneUrl = url + hostname
      cloneUrl = cloneUrl.replace(/\.git$/, "") + ".git"

      console.log(`Running: git clone ${cloneUrl} ${folderName}`)

      const cloneProcess = spawn("git", ["clone", cloneUrl, folderName], { cwd })

      cloneProcess.stdout.on("data", data => {
        process.stdout.write(data.toString())
      })

      cloneProcess.stderr.on("data", data => {
        process.stderr.write(data.toString())
      })

      cloneProcess.on("error", error => {
        reject(error)
      })

      cloneProcess.on("close", async code => {
        if (code === 0) {
          console.log(`Cloned successfully into ${folderName}`)
          try {
            const scrollCli = new ScrollCli()
            await scrollCli.buildCommand(path.join(cwd, folderName))
            resolve()
          } catch (error) {
            reject(error)
          }
        } else {
          reject(new Error(`git clone failed with code ${code}`))
        }
      })
    })
  }

  async cloneCommand(cwd, urls) {
    for (const gitUrl of urls) {
      await this.clone(cwd, gitUrl)
    }
  }
}

if (module && !module.parent) new CloneCli().cloneCommand(process.cwd(), parseArgs(process.argv.slice(2))._)

module.exports = { CloneCli }
