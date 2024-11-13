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
const { ParticleFileSystem } = require("scrollsdk/products/ParticleFileSystem.js")
const stumpParser = require("scrollsdk/products/stump.nodejs.js")
const packageJson = require("./package.json")

// Constants
const SCROLL_VERSION = packageJson.version
const SCROLL_FILE_EXTENSION = ".scroll"
const PARSERS_FILE_EXTENSION = ".parsers"
const EXTERNALS_PATH = path.join(__dirname, "external")
const importParticleRegex = /^(import .+|[a-zA-Z\_\-\.0-9\/]+\.(scroll|parsers)$)/gm

// todo: all of these should be in parsers
const scrollKeywords = {
  replace: "replace",
  replaceJs: "replaceJs",
  replaceNodejs: "replaceNodejs",
  footer: "footer"
}

class FileInterface {
  EXTERNALS_PATH
  SCROLL_VERSION
}

class ScrollFileSystem extends ParticleFileSystem {
  getScrollFile(filePath) {
    return this._getParsedFile(filePath, ScrollFile)
  }

  productCache = {}
  writeProduct(absolutePath, content) {
    this.productCache[absolutePath] = content
    return this.write(absolutePath, content)
  }

  parsedFiles = {}
  _getParsedFile(absolutePath, parser) {
    if (this.parsedFiles[absolutePath]) return this.parsedFiles[absolutePath]
    this.parsedFiles[absolutePath] = new parser(undefined, absolutePath, this)
    return this.parsedFiles[absolutePath]
  }

  folderCache = {}
  getScrollFilesInFolder(folderPath) {
    return this._getFilesInFolder(folderPath, SCROLL_FILE_EXTENSION)
  }

  getParserFilesInFolder(folderPath) {
    return this._getFilesInFolder(folderPath, PARSERS_FILE_EXTENSION)
  }

  _getFilesInFolder(folderPath, extension) {
    folderPath = Utils.ensureFolderEndsInSlash(folderPath)
    if (this.folderCache[folderPath]) return this.folderCache[folderPath]
    const files = this.list(folderPath)
      .filter(file => file.endsWith(extension))
      .map(filePath => this.getScrollFile(filePath))

    const sorted = lodash.sortBy(files, file => file.timestamp).reverse()
    sorted.forEach((file, index) => (file.timeIndex = index))
    this.folderCache[folderPath] = sorted
    return this.folderCache[folderPath]
  }
}
const defaultScrollParser = new ParticleFileSystem().getParser(Disk.getFiles(path.join(__dirname, "parsers")).filter(file => file.endsWith(PARSERS_FILE_EXTENSION)))
const DefaultScrollParser = defaultScrollParser.parser // todo: remove?

class ScrollFile {
  constructor(codeAtStart, absoluteFilePath = "", fileSystem = new ScrollFileSystem({})) {
    this.fileSystem = fileSystem
    if (codeAtStart === undefined) codeAtStart = absoluteFilePath ? fileSystem.read(absoluteFilePath) : ""

    this.filePath = absoluteFilePath
    this.filename = path.basename(this.filePath)
    this.folderPath = path.dirname(absoluteFilePath) + "/"

    // PASS 1: READ FULL FILE
    this.codeAtStart = codeAtStart

    // PASS 2: READ AND REPLACE IMPORTs
    let codeAfterImportPass = codeAtStart
    let parser = DefaultScrollParser
    if (absoluteFilePath) {
      const assembledFile = fileSystem.assembleFile(absoluteFilePath, defaultScrollParser.parsersCode)
      this.importOnly = assembledFile.isImportOnly
      codeAfterImportPass = assembledFile.afterImportPass
      if (assembledFile.parser) parser = assembledFile.parser
      this.dependencies = assembledFile.importFilePaths
      this.assembledFile = assembledFile
    }
    this.codeAfterImportPass = codeAfterImportPass

    // PASS 3: READ AND REPLACE MACROS. PARSE AND REMOVE MACROS DEFINITIONS THEN REPLACE REFERENCES.
    const codeAfterMacroPass = this.evalMacros(codeAfterImportPass, codeAtStart, this.filePath)

    // PASS 4: READ WITH STD COMPILER OR CUSTOM COMPILER.
    this.codeAfterMacroPass = codeAfterMacroPass
    this.parser = parser
    this.scrollProgram = new parser(codeAfterMacroPass)

    this.timestamp = dayjs(this.scrollProgram.get("date") ?? this.fileSystem.getCTime(this.filePath) ?? 0).unix()
    this.scrollProgram.setFile(this)
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

  formatAndSave() {
    const { codeAtStart, formatted } = this
    if (codeAtStart === formatted) return false
    this.fileSystem.write(this.filePath, formatted)
    return true
  }

  log(message) {
    if (this.logger) this.logger.log(message)
  }

  async buildAll() {
    // todo: remove
    await scrollProgram.buildAll()
  }

  getFileFromId(id) {
    return this.fileSystem.getScrollFile(path.join(this.folderPath, id + ".scroll"))
  }

  get allScrollFiles() {
    return this.fileSystem.getScrollFilesInFolder(this.folderPath)
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

  evalMacros(code, codeAtStart, absolutePath) {
    // note: the 2 params above are not used in this method, but may be used in user eval code. (todo: cleanup)
    const regex = /^(replace|footer$)/gm
    if (!regex.test(code)) return code
    const particle = new Particle(code) // todo: this can be faster. a more lightweight particle class?
    // Process macros
    const macroMap = {}
    particle
      .filter(particle => {
        const parserAtom = particle.cue
        return parserAtom === scrollKeywords.replace || parserAtom === scrollKeywords.replaceJs || parserAtom === scrollKeywords.replaceNodejs
      })
      .forEach(particle => {
        let value = particle.length ? particle.subparticlesToString() : particle.getAtomsFrom(2).join(" ")
        const kind = particle.cue
        if (kind === scrollKeywords.replaceJs) value = eval(value)
        if (kind === scrollKeywords.replaceNodejs) {
          const tempPath = this.filePath + ".js"
          if (Disk.exists(tempPath)) throw new Error(`Failed to write/require replaceNodejs snippet since '${tempPath}' already exists.`)
          try {
            Disk.write(tempPath, value)
            const results = require(tempPath)
            Object.keys(results).forEach(key => (macroMap[key] = results[key]))
          } catch (err) {
            console.error(`Error in evalMacros in file '${this.filePath}'`)
            console.error(err)
          } finally {
            Disk.rm(tempPath)
          }
        } else macroMap[particle.getAtom(1)] = value
        particle.destroy() // Destroy definitions after eval
      })

    if (particle.has(scrollKeywords.footer)) {
      const pushes = particle.getParticles(scrollKeywords.footer)
      const append = pushes.map(push => push.section.join("\n")).join("\n")
      pushes.forEach(push => {
        push.section.forEach(particle => particle.destroy())
        push.destroy()
      })
      code = particle.asString + append
    }

    const keys = Object.keys(macroMap)
    if (!keys.length) return code

    let codeAfterMacroSubstitution = particle.asString
    // Todo: speed up. build a template?
    Object.keys(macroMap).forEach(key => (codeAfterMacroSubstitution = codeAfterMacroSubstitution.replace(new RegExp(key, "g"), macroMap[key])))

    return codeAfterMacroSubstitution
  }

  get mtimeMs() {
    return this.fileSystem.getMTime(this.filePath)
  }

  SCROLL_VERSION = SCROLL_VERSION
  EXTERNALS_PATH = EXTERNALS_PATH
  importOnly = false
  filePath = ""

  compileStumpCode(code) {
    return new stumpParser(code).compile()
  }

  timeIndex = 0

  _nextAndPrevious(arr, index) {
    const nextIndex = index + 1
    const previousIndex = index - 1
    return {
      previous: arr[previousIndex] ?? arr[arr.length - 1],
      next: arr[nextIndex] ?? arr[0]
    }
  }

  // keyboard nav is always in the same folder. does not currently support cross folder
  includeFileInKeyboardNav(file) {
    const { scrollProgram } = file
    return scrollProgram.buildsHtml && scrollProgram.hasKeyboardNav && scrollProgram.tags.includes(this.scrollProgram.primaryTag)
  }

  get linkToPrevious() {
    if (!this.scrollProgram.hasKeyboardNav)
      // Dont provide link to next unless keyboard nav is on
      return undefined
    let file = this._nextAndPrevious(this.allScrollFiles, this.timeIndex).previous
    while (!this.includeFileInKeyboardNav(file)) {
      file = this._nextAndPrevious(this.allScrollFiles, file.timeIndex).previous
    }
    return file.scrollProgram.permalink
  }

  get linkToNext() {
    if (!this.scrollProgram.hasKeyboardNav)
      // Dont provide link to next unless keyboard nav is on
      return undefined
    let file = this._nextAndPrevious(this.allScrollFiles, this.timeIndex).next
    while (!this.includeFileInKeyboardNav(file)) {
      file = this._nextAndPrevious(this.allScrollFiles, file.timeIndex).next
    }
    return file.scrollProgram.permalink
  }

  get(parserAtom) {
    return this.scrollProgram.get(parserAtom)
  }

  has(parserAtom) {
    return this.scrollProgram.has(parserAtom)
  }

  // todo: clean up this naming pattern and add a parser instead of special casing 404.html
  get allHtmlFiles() {
    return this.allScrollFiles.filter(file => file.scrollProgram.buildsHtml && file.scrollProgram.permalink !== "404.html")
  }

  getFilesByTags(tags, limit) {
    // todo: tags is currently matching partial substrings
    const getFilesWithTag = (tag, files) => files.filter(file => file.scrollProgram.buildsHtml && file.scrollProgram.tags.includes(tag))
    if (typeof tags === "string") tags = tags.split(" ")
    if (!tags || !tags.length)
      return this.allHtmlFiles
        .filter(file => file !== this) // avoid infinite loops. todo: think this through better.
        .map(file => {
          return { file, relativePath: "" }
        })
        .slice(0, limit)
    let arr = []
    tags.forEach(name => {
      if (!name.includes("/"))
        return (arr = arr.concat(
          getFilesWithTag(name, this.allScrollFiles)
            .map(file => {
              return { file, relativePath: "" }
            })
            .slice(0, limit)
        ))
      const parts = name.split("/")
      const group = parts.pop()
      const relativePath = parts.join("/")
      const folderPath = path.join(this.folderPath, path.normalize(relativePath))
      const files = this.fileSystem.getScrollFilesInFolder(folderPath)
      const filtered = getFilesWithTag(group, files).map(file => {
        return { file, relativePath: relativePath + "/" }
      })

      arr = arr.concat(filtered.slice(0, limit))
    })

    return lodash.sortBy(arr, file => file.file.timestamp).reverse()
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

  getErrorsInFolder(folder) {
    const fileSystem = new ScrollFileSystem()
    const folderPath = Utils.ensureFolderEndsInSlash(folder)
    fileSystem.getScrollFilesInFolder(folderPath) // Init all parsers
    const parserErrors = fileSystem.parsers.map(parser => parser.getAllErrors().map(err => err.toObject())).flat()

    const scrollErrors = fileSystem
      .getScrollFilesInFolder(folderPath)
      .map(file =>
        file.scrollProgram.getAllErrors().map(err => {
          return { filename: file.filename, ...err.toObject() }
        })
      )
      .flat()

    return { parserErrors, scrollErrors }
  }

  testCommand(cwd) {
    const start = Date.now()
    const folder = this.resolvePath(cwd)
    const { parserErrors, scrollErrors } = this.getErrorsInFolder(folder)

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

  formatCommand(cwd) {
    const fileSystem = new ScrollFileSystem()
    const folder = this.resolvePath(cwd)
    const files = fileSystem.getScrollFilesInFolder(folder)
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
    const files = fileSystem.getScrollFilesInFolder(folder)
    this.log(`Found ${files.length} scroll files in '${folder}'\n`)
    const res = await this.buildFiles(fileSystem, files, folder)
    return res
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
