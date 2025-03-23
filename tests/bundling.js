#! /usr/bin/env node

// NPM ecosystem includes
const path = require("path")
const lodash = require("lodash")

// Particles Includes
const { Particle } = require("scrollsdk/products/Particle.js")
const { Disk } = require("scrollsdk/products/Disk.node.js")
const { Utils } = require("scrollsdk/products/Utils.js")
const { Fusion, FusionFile } = require("scrollsdk/products/Fusion.js")
const { SimpleCLI } = require("./simpleCli.js")
const packageJson = require("./package.json")

// Constants
const SCROLL_VERSION = packageJson.version
const SCROLL_FILE_EXTENSION = ".scroll"
const PARSERS_FILE_EXTENSION = ".parsers"
const EXTERNALS_PATH = path.join(__dirname, "external")

// todo: remove
class ScrollFileSystem extends Fusion {
  defaultFileClass = ScrollFile
}

const defaultParserFiles = Disk.getFiles(path.join(__dirname, "parsers")).filter(file => file.endsWith(PARSERS_FILE_EXTENSION))
const defaultParser = Fusion.combineParsers(
  defaultParserFiles,
  defaultParserFiles.map(filePath => Disk.read(filePath))
)
const DefaultScrollParser = defaultParser.parser

// todo: remove
class ScrollFile extends FusionFile {
  EXTERNALS_PATH = EXTERNALS_PATH
  defaultParserCode = defaultParser.parsersCode
  defaultParser = DefaultScrollParser
}

class ScrollCli extends SimpleCLI {
  welcomeMessage = `\n📜 WELCOME TO SCROLL (v${SCROLL_VERSION})`
  async initCommand(cwd) {
    // todo: use stamp for this.
    const initFolder = {
      ".gitignore": `*.html
*.rss
*.txt
.*.js
.*.css
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

  sfs = new ScrollFileSystem()

  deleteCommand() {
    return this.log(`\n💡 To delete a Scroll just delete the folder\n`)
  }

  async getErrorsInFolder(folder) {
    const fileSystem = this.sfs
    const folderPath = Utils.ensureFolderEndsInSlash(folder)
    const files = await fileSystem.getLoadedFilesInFolder(folderPath, ".scroll") // Init/cache all parsers
    const parserErrors = fileSystem.parsers.map(parser => parser.getAllErrors().map(err => err.toObject())).flat()
    const scrollErrors = await this.getErrorsInFiles(files)
    return { parserErrors, scrollErrors }
  }

  async getErrorsInFiles(files) {
    // todo: what about parser errors?
    for (let file of files) await file.scrollProgram.load()
    return files
      .map(file => {
        const { scrollProgram } = file
        return scrollProgram.getAllErrors().map(err => {
          return { filename: scrollProgram.filename, ...err.toObject() }
        })
      })
      .flat()
  }

  async testCommand(cwd, filenames) {
    const start = Date.now()
    const folder = this.resolvePath(cwd)
    let target = cwd
    let parserErrors = []
    let scrollErrors = []
    if (filenames && filenames.length) {
      const files = await this.getFiles(cwd, filenames)
      scrollErrors = await this.getErrorsInFiles(files)
      target = filenames.join(" ")
    } else {
      const results = await this.getErrorsInFolder(folder)
      parserErrors = results.parserErrors
      scrollErrors = results.scrollErrors
    }

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
    if (!parserErrors.length && !scrollErrors.length) return this.log(`✅ 0 errors in "${target}". Tests took ${seconds} seconds.`)
    return `${parserErrors.length + scrollErrors.length} Errors`
  }

  async formatCommand(cwd, filenames) {
    let files = []
    if (filenames && filenames.length) files = await this.getFiles(cwd, filenames)
    else files = await this.sfs.getLoadedFilesInFolder(this.resolvePath(cwd), ".scroll")
    // .concat(fileSystem.getLoadedFilesInFolder(folder, PARSERS_FILE_EXTENSION)) // todo: should format parser files too.
    for (let file of files) {
      this.formatFile(file)
    }
  }

  async formatFile(file) {
    const { formatted, filePath, filename } = file.scrollProgram
    const { codeAtStart } = file
    if (codeAtStart === formatted) return
    await this.sfs.write(filePath, formatted)
    this.log(`💾 formatted ${filename}`)
  }

  // A user provides a list of filenames such as 'index.scroll ../foobar.scroll' and we
  // know the cwd, turn them into absolute file paths
  resolveFilenames(cwd, filenames) {
    return filenames
      .filter(filename => filename.length > 0) // Remove empty strings
      .map(filename => path.resolve(cwd, filename)) // Convert to absolute paths
  }

  async getFiles(cwd, filenames) {
    const fullPaths = this.resolveFilenames(cwd, filenames)
    const files = await Promise.all(fullPaths.map(fp => this.sfs.getLoadedFile(fp)))
    return files
  }

  async buildCommand(cwd, filenames) {
    if (filenames && filenames.length) {
      const files = await this.getFiles(cwd, filenames)
      this.log(`Building ${filenames.length} scroll files\n`)
      return await this.buildFiles(this.sfs, files, cwd)
    }
    await this.buildFilesInFolder(this.sfs, this.resolvePath(cwd))
    return this
  }

  async buildFiles(fileSystem, files, folder, options = {}) {
    const start = Date.now()
    // Run the build loop twice. The first time we build ScrollSets, in case some of the HTML files
    // will depend on csv/tsv/json/etc
    const toBuild = files.filter(file => !file.importOnly)
    options.externalFilesCopied = {}
    for (const file of toBuild) {
      file.scrollProgram.logger = this
      await file.scrollProgram.load()
    }
    for (const file of toBuild) {
      await file.scrollProgram.buildOne(options)
    }
    for (const file of toBuild) {
      await file.scrollProgram.buildTwo(options)
    }
    const seconds = (Date.now() - start) / 1000
    this.log(``)
    const outputExtensions = fileSystem.productCache.map(filename => filename.split(".").pop())
    const buildStats = lodash.map(lodash.orderBy(lodash.toPairs(lodash.countBy(outputExtensions)), 1, "desc"), ([extension, count]) => ({ extension, count }))
    this.log(
      `⌛️ Read ${files.length} scroll files and wrote ${fileSystem.productCache.length} files (${buildStats.map(i => i.extension + ":" + i.count).join(" ")}) in ${seconds} seconds. Processed ${lodash.round(
        files.length / seconds
      )} scroll files per second\n`
    )

    return fileSystem.productCache
  }

  async buildFilesInFolder(fileSystem, folder = "/") {
    folder = Utils.ensureFolderEndsInSlash(folder)
    const files = await fileSystem.getLoadedFilesInFolder(folder, ".scroll")
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

if (module && !module.parent) new ScrollCli().executeUsersInstructionsFromShell()

module.exports = { ScrollFile, ScrollCli, SimpleCLI, ScrollFileSystem, DefaultScrollParser }
;

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