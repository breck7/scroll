#! /usr/bin/env node

// NPM ecosystem includes
const path = require("path")
const lodash = require("lodash")

// Particles Includes
const { Particle } = require("scrollsdk/products/Particle.js")
const { Disk } = require("scrollsdk/products/Disk.node.js")
const { ScrollFileSystem } = require("scrollsdk/products/ScrollFileSystem.js")
const { SimpleCLI } = require("./simpleCli.js")
const packageJson = require("./package.json")

const ensureFolderEndsInSlash = folder => folder.replace(/\/$/, "") + "/"

class ScrollCli extends SimpleCLI {
  welcomeMessage = `\n📜 WELCOME TO SCROLL (v${packageJson.version})`
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

  async scrollToHtml(scrollCode) {
    const ScrollFile = this.sfs.defaultFileClass
    const page = new ScrollFile(scrollCode)
    await page.fuse()
    return page.scrollProgram.asHtml
  }

  sfs = new ScrollFileSystem(undefined, path.join(__dirname, "parsers"))
  initFs(obj) {
    // for testing
    this.sfs = new ScrollFileSystem(obj, path.join(__dirname, "parsers"))
    return this.sfs
  }

  deleteCommand() {
    return this.log(`\n💡 To delete a Scroll just delete the folder\n`)
  }

  async getErrorsInFolder(folder) {
    const fileSystem = this.sfs
    const folderPath = ensureFolderEndsInSlash(folder)
    const files = await fileSystem.getLoadedFilesInFolder(folderPath, ".scroll") // Init/cache all parsers

    // todo: cleanup
    const parsers = await Promise.all(Object.values(fileSystem._parserCache))
    const parserErrors = parsers.map(parser => parser.parsersParser.getAllErrors().map(err => err.toObject())).flat()

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
    // .concat(fileSystem.getLoadedFilesInFolder(folder, ".parsers")) // todo: should format parser files too.
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
    await this.buildFilesInFolder(this.resolvePath(cwd))
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

  async buildFilesInFolder(folder = "/", fileSystem = this.sfs) {
    folder = ensureFolderEndsInSlash(folder)
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
      if (!filename.endsWith(".scroll")) return

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

module.exports = { ScrollCli, SimpleCLI }
