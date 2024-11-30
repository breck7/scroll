#! /usr/bin/env node

// NPM ecosystem includes
const parseArgs = require("minimist")
const path = require("path")
const fs = require("fs")
const lodash = require("lodash")
const dayjs = require("dayjs")

// Particles Includes
const { Particle } = require("scrollsdk/products/Particle.js")
const { Disk } = require("scrollsdk/products/Disk.node.js")
const { Utils } = require("scrollsdk/products/Utils.js")
const { Fusion, FusionFile } = require("scrollsdk/products/Fusion.js")
const packageJson = require("./package.json")

// Constants
const SCROLL_VERSION = packageJson.version
const SCROLL_FILE_EXTENSION = ".scroll"
const PARSERS_FILE_EXTENSION = ".parsers"
const EXTERNALS_PATH = path.join(__dirname, "external")
const importParticleRegex = /^(import .+|[a-zA-Z\_\-\.0-9\/]+\.(scroll|parsers)$)/gm

class ScrollFileSystem extends Fusion {
  defaultFileClass = ScrollFile
  async getScrollFilesInFolder(folderPath) {
    return await this.getLoadedFilesInFolder(folderPath, SCROLL_FILE_EXTENSION)
  }
  async getParserFilesInFolder(folderPath) {
    return await this.getLoadedFilesInFolder(folderPath, PARSERS_FILE_EXTENSION)
  }
}

const defaultParserFiles = Disk.getFiles(path.join(__dirname, "parsers")).filter(file => file.endsWith(PARSERS_FILE_EXTENSION))
const defaultParser = Fusion.combineParsers(
  defaultParserFiles,
  defaultParserFiles.map(filePath => Disk.read(filePath))
)
const DefaultScrollParser = defaultParser.parser

class ScrollFile extends FusionFile {
  EXTERNALS_PATH = EXTERNALS_PATH

  defaultParserCode = defaultParser.parsersCode

  parseCode() {
    const results = new DefaultScrollParser().parseAndCompile(this.fusedCode, this.codeAtStart, this.filePath, this.fusedFile?.parser || DefaultScrollParser)
    this.codeAfterMacroPass = results.codeAfterMacroPass
    this.parser = results.parser
    this.scrollProgram = results.scrollProgram
    this.scrollProgram.setFile(this)
    const date = this.scrollProgram.get("date")
    if (date) this.timestamp = dayjs(this.scrollProgram.get("date")).unix()
  }

  // todo: speed this up and do a proper release. also could add more metrics like this.
  get lastCommitTime() {
    if (this._lastCommitTime === undefined) {
      try {
        this._lastCommitTime = require("child_process").execSync(`git log -1 --format="%at" -- "${this.filePath}"`).toString().trim()
      } catch (err) {
        this._lastCommitTime = 0
      }
    }
    return this._lastCommitTime
  }

  log(message) {
    if (this.logger) this.logger.log(message)
  }

  async getFileFromId(id) {
    return await this.fileSystem.getLoadedFile(path.join(this.folderPath, id + ".scroll"))
  }

  get parsersBundle() {
    let code =
      `parsers/atomTypes.parsers
parsers/root.parsers
parsers/build.parsers
parsers/comments.parsers
parsers/blankLine.parsers
parsers/measures.parsers
parsers/errors.parsers`
        .trim()
        .split("\n")
        .map(filepath => Disk.read(path.join(__dirname, filepath)))
        .join("\n\n")
        .replace("catchAllParser catchAllParagraphParser", "catchAllParser errorParser") + this.scrollProgram.toString()

    code = code.replace(/^importOnly\n/gm, "").replace(importParticleRegex, "")

    code = new Particle(code)
    code.getParticle("commentParser").appendLine("boolean suggestInAutocomplete false")
    code.getParticle("slashCommentParser").appendLine("boolean suggestInAutocomplete false")
    code.getParticle("buildMeasuresParser").appendLine("boolean suggestInAutocomplete false")

    return code.toString()
  }

  get formatted() {
    return this.scrollProgram.getFormatted(this.codeAtStart)
  }

  get mtimeMs() {
    return this.fileSystem.getMTime(this.filePath)
  }

  get(parserAtom) {
    return this.scrollProgram.get(parserAtom)
  }

  has(parserAtom) {
    return this.scrollProgram.has(parserAtom)
  }
}

const isUserPipingInput = () => {
  if (process.platform === "win32") return false

  // Check if stdin is explicitly set to a TTY
  if (process.stdin.isTTY === true) return false

  return fs.fstatSync(0).isFIFO()
}

class SimpleCLI {
  CommandFnDecoratorSuffix = "Command"

  executeUsersInstructionsFromShell(args = [], userIsPipingInput = isUserPipingInput()) {
    const command = args[0] // Note: we don't take any parameters on purpose. Simpler UX.
    const commandName = `${command}${this.CommandFnDecoratorSuffix}`
    if (this[commandName]) return userIsPipingInput ? this._runCommandOnPipedStdIn(commandName) : this[commandName](process.cwd())
    else if (command) this.log(`No command '${command}'. Running help command.`)
    else this.log(`No command provided. Running help command.`)
    return this.helpCommand()
  }

  _runCommandOnPipedStdIn(commandName) {
    this.log(`Running ${commandName} on piped input`)
    let pipedData = ""
    process.stdin.on("readable", function () {
      pipedData += this.read() // todo: what's the lambda way to do this?
    })
    process.stdin.on("end", async () => {
      const folders = pipedData
        .trim()
        .split("\n")
        .map(line => line.trim())
        .filter(line => fs.existsSync(line))

      for (const line of folders) {
        await this[commandName](line)
      }

      if (folders.length === 0)
        // Hacky to make sure this at least does something in all environments.
        // process.stdin.isTTY is not quite accurate for pipe detection
        this[commandName](process.cwd())
    })
  }

  silence() {
    this.verbose = false
    return this
  }

  verbose = true

  log(message) {
    if (this.verbose) console.log(message)
    return message
  }

  get _allCommands() {
    return Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(atom => atom.endsWith(this.CommandFnDecoratorSuffix))
      .sort()
  }

  // Normalize 3 possible inputs: 1) cwd of the process 2) provided absolute path 3) cwd of process + provided relative path
  resolvePath(folder = "") {
    return path.isAbsolute(folder) ? path.normalize(folder) : path.resolve(path.join(process.cwd(), folder))
  }

  helpCommand() {
    this.log(this.welcomeMessage)
    return this.log(`\nAvailable commands:\n\n${this._allCommands.map(comm => `🖌️ ` + comm.replace(this.CommandFnDecoratorSuffix, "")).join("\n")}\n`)
  }
}

class ScrollCli extends SimpleCLI {
  welcomeMessage = `\n📜 WELCOME TO SCROLL (v${SCROLL_VERSION})`
  async initCommand(cwd) {
    // todo: use stamp for this.
    const initFolder = {
      ".gitignore": `*.html
*.txt
feed.xml`,
      "header.scroll": `importOnly
metaTags
buildTxt
buildHtml
theme gazette
homeButton
leftRightButtons
editButton
printTitle`,
      "feed.scroll": `buildRss
printFeed All`,
      "footer.scroll": `importOnly
center
editButton
scrollVersionLink`,
      "helloWorld.scroll": `tags All
header.scroll
thinColumn
This is my first blog post using Scroll.

****

footer.scroll`,
      "index.scroll": `title My Blog
header.scroll
printSnippets All
footer.scroll`
    }

    this.log(`Initializing scroll in "${cwd}"`)
    Disk.writeObjectToDisk(cwd, initFolder)
    require("child_process").execSync("git init", { cwd })
    return this.log(`\n✅ Initialized new scroll in '${cwd}'. Build your new site with: scroll build`)
  }

  deleteCommand() {
    return this.log(`\n💡 To delete a Scroll just delete the folder\n`)
  }

  async getErrorsInFolder(folder) {
    const fileSystem = new ScrollFileSystem()
    const folderPath = Utils.ensureFolderEndsInSlash(folder)
    const files = await fileSystem.getScrollFilesInFolder(folderPath) // Init/cache all parsers
    const parserErrors = fileSystem.parsers.map(parser => parser.getAllErrors().map(err => err.toObject())).flat()
    // load all files
    for (let file of files) {
      await file.scrollProgram.load()
    }
    const scrollErrors = files
      .map(file =>
        file.scrollProgram.getAllErrors().map(err => {
          return { filename: file.filename, ...err.toObject() }
        })
      )
      .flat()

    return { parserErrors, scrollErrors }
  }

  async testCommand(cwd) {
    const start = Date.now()
    const folder = this.resolvePath(cwd)
    const { parserErrors, scrollErrors } = await this.getErrorsInFolder(folder)

    const seconds = (Date.now() - start) / 1000

    if (parserErrors.length) {
      this.log(``)
      this.log(`❌ ${parserErrors.length} parser errors in "${cwd}"`)
      this.log(new Particle(parserErrors).toFormattedTable(200))
      this.log(``)
    }
    if (scrollErrors.length) {
      this.log(``)
      this.log(`❌ ${scrollErrors.length} errors in "${cwd}"`)
      this.log(new Particle(scrollErrors).toFormattedTable(100))
      this.log(``)
    }
    if (!parserErrors.length && !scrollErrors.length) return this.log(`✅ 0 errors in "${cwd}". Tests took ${seconds} seconds.`)
    return `${parserErrors.length + scrollErrors.length} Errors`
  }

  async formatCommand(cwd) {
    const fileSystem = new ScrollFileSystem()
    const folder = this.resolvePath(cwd)
    const files = await fileSystem.getScrollFilesInFolder(folder)
    // .concat(fileSystem.getParserFilesInFolder(folder)) // todo: should format parser files too.
    files.forEach(file => (file.formatAndSave() ? this.log(`💾 formatted ${file.filename}`) : ""))
  }

  async buildCommand(cwd) {
    await this.buildFilesInFolder(new ScrollFileSystem(), this.resolvePath(cwd))
    return this
  }

  async buildFiles(fileSystem, files, folder) {
    const start = Date.now()
    // Run the build loop twice. The first time we build ScrollSets, in case some of the HTML files
    // will depend on csv/tsv/json/etc
    const toBuild = files.filter(file => !file.importOnly)
    const externalFilesCopied = {}
    for (const file of toBuild) {
      file.logger = this
      await file.scrollProgram.load()
    }
    for (const file of toBuild) {
      await file.scrollProgram.buildOne()
    }
    for (const file of toBuild) {
      await file.scrollProgram.buildTwo(externalFilesCopied)
    }
    const seconds = (Date.now() - start) / 1000
    this.log(``)
    const outputExtensions = Object.keys(fileSystem.productCache).map(filename => filename.split(".").pop())
    const buildStats = lodash.map(lodash.orderBy(lodash.toPairs(lodash.countBy(outputExtensions)), 1, "desc"), ([extension, count]) => ({ extension, count }))
    this.log(
      `⌛️ Read ${files.length} scroll files and wrote ${Object.keys(fileSystem.productCache).length} files (${buildStats.map(i => i.extension + ":" + i.count).join(" ")}) in ${seconds} seconds. Processed ${lodash.round(
        files.length / seconds
      )} scroll files per second\n`
    )

    return fileSystem.productCache
  }

  async buildFilesInFolder(fileSystem, folder = "/") {
    folder = Utils.ensureFolderEndsInSlash(folder)
    const files = await fileSystem.getScrollFilesInFolder(folder)
    this.log(`Found ${files.length} scroll files in '${folder}'\n`)
    return await this.buildFiles(fileSystem, files, folder)
  }

  listCommand(cwd) {
    return this.findScrollsInDirRecursive(cwd)
  }

  findScrollsInDirRecursive(dir) {
    const folders = {}
    Disk.recursiveReaddirSync(dir, filename => {
      if (!filename.endsWith(SCROLL_FILE_EXTENSION)) return

      const folder = path.dirname(filename)
      if (!folders[folder]) {
        folders[folder] = {
          folder,
          scrollFileCount: 0
        }
        this.log(folder)
      }
      folders[folder].scrollFileCount++
    })

    return folders
  }
}

if (module && !module.parent) new ScrollCli().executeUsersInstructionsFromShell(parseArgs(process.argv.slice(2))._)

module.exports = { ScrollFile, ScrollCli, SimpleCLI, ScrollFileSystem, DefaultScrollParser }
