#! /usr/bin/env node

// NPM ecosystem includes
const parseArgs = require("minimist")
const path = require("path")
const fs = require("fs")
const lodash = require("lodash")
const dayjs = require("dayjs")

// Tree Notation Includes
const { TreeNode } = require("jtree/products/TreeNode.js")
const { Disk } = require("jtree/products/Disk.node.js")
const { Utils } = require("jtree/products/Utils.js")
const { TreeFileSystem } = require("jtree/products/TreeFileSystem.js")
const stumpParser = require("jtree/products/stump.nodejs.js")
const packageJson = require("./package.json")

// Constants
const SCROLL_VERSION = packageJson.version
const SCROLL_FILE_EXTENSION = ".scroll"
const GRAMMAR_EXTENSION = ".grammar"
// Todo: how to keep in sync with grammar?
const scrollKeywords = {
  title: "title",
  description: "description",
  viewSourceUrl: "viewSourceUrl",
  permalink: "permalink",
  canonicalLink: "canonicalLink",
  image: "image",
  date: "date",
  thoughtKeyword: "*",
  endSnippet: "endSnippet",
  groups: "groups",
  keyboardNav: "keyboardNav",
  replace: "replace",
  replaceJs: "replaceJs",
  nodejs: "nodejs",
  replaceDefault: "replaceDefault",
  writeDataset: "writeDataset",
  import: "import",
  importOnly: "importOnly",
  baseUrl: "baseUrl",
  viewSourceBaseUrl: "viewSourceBaseUrl",
  openGraphImage: "openGraphImage",
  git: "git",
  email: "email",
  rssFeedUrl: "rssFeedUrl"
}
const SVGS = {
  git: `<svg xmlns="http://www.w3.org/2000/svg" width="92pt" height="92pt" viewBox="0 0 92 92"><path d="M90.156 41.965 50.036 1.848a5.913 5.913 0 0 0-8.368 0l-8.332 8.332 10.566 10.566a7.03 7.03 0 0 1 7.23 1.684 7.043 7.043 0 0 1 1.673 7.277l10.183 10.184a7.026 7.026 0 0 1 7.278 1.672 7.04 7.04 0 0 1 0 9.957 7.045 7.045 0 0 1-9.961 0 7.038 7.038 0 0 1-1.532-7.66l-9.5-9.497V59.36a7.04 7.04 0 0 1 1.86 11.29 7.04 7.04 0 0 1-9.957 0 7.04 7.04 0 0 1 0-9.958 7.034 7.034 0 0 1 2.308-1.539V33.926a7.001 7.001 0 0 1-2.308-1.535 7.049 7.049 0 0 1-1.516-7.7L29.242 14.273 1.734 41.777a5.918 5.918 0 0 0 0 8.371L41.855 90.27a5.92 5.92 0 0 0 8.368 0l39.933-39.934a5.925 5.925 0 0 0 0-8.371"/></g></svg>`,
  email: `<svg viewBox="3 5 24 20" width="24" height="20" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 0, -289.0625)"><path style="opacity:1;stroke:none;stroke-width:0.49999997;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" d="M 5 5 C 4.2955948 5 3.6803238 5.3628126 3.3242188 5.9101562 L 14.292969 16.878906 C 14.696939 17.282876 15.303061 17.282876 15.707031 16.878906 L 26.675781 5.9101562 C 26.319676 5.3628126 25.704405 5 25 5 L 5 5 z M 3 8.4140625 L 3 23 C 3 24.108 3.892 25 5 25 L 25 25 C 26.108 25 27 24.108 27 23 L 27 8.4140625 L 17.121094 18.292969 C 15.958108 19.455959 14.041892 19.455959 12.878906 18.292969 L 3 8.4140625 z " transform="translate(0,289.0625)" id="rect4592"/></g></svg>`,
  home: `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.7166 3.79541C12.2835 3.49716 11.7165 3.49716 11.2834 3.79541L4.14336 8.7121C3.81027 8.94146 3.60747 9.31108 3.59247 9.70797C3.54064 11.0799 3.4857 13.4824 3.63658 15.1877C3.7504 16.4742 4.05336 18.1747 4.29944 19.4256C4.41371 20.0066 4.91937 20.4284 5.52037 20.4284H8.84433C8.98594 20.4284 9.10074 20.3111 9.10074 20.1665V15.9754C9.10074 14.9627 9.90433 14.1417 10.8956 14.1417H13.4091C14.4004 14.1417 15.204 14.9627 15.204 15.9754V20.1665C15.204 20.3111 15.3188 20.4284 15.4604 20.4284H18.4796C19.0806 20.4284 19.5863 20.0066 19.7006 19.4256C19.9466 18.1747 20.2496 16.4742 20.3634 15.1877C20.5143 13.4824 20.4594 11.0799 20.4075 9.70797C20.3925 9.31108 20.1897 8.94146 19.8566 8.7121L12.7166 3.79541ZM10.4235 2.49217C11.3764 1.83602 12.6236 1.83602 13.5765 2.49217L20.7165 7.40886C21.4457 7.91098 21.9104 8.73651 21.9448 9.64736C21.9966 11.0178 22.0564 13.5119 21.8956 15.3292C21.7738 16.7067 21.4561 18.4786 21.2089 19.7353C20.9461 21.0711 19.7924 22.0001 18.4796 22.0001H15.4604C14.4691 22.0001 13.6655 21.1791 13.6655 20.1665V15.9754C13.6655 15.8307 13.5507 15.7134 13.4091 15.7134H10.8956C10.754 15.7134 10.6392 15.8307 10.6392 15.9754V20.1665C10.6392 21.1791 9.83561 22.0001 8.84433 22.0001H5.52037C4.20761 22.0001 3.05389 21.0711 2.79113 19.7353C2.54392 18.4786 2.22624 16.7067 2.10437 15.3292C1.94358 13.5119 2.00338 11.0178 2.05515 9.64736C2.08957 8.73652 2.55427 7.91098 3.28346 7.40886L10.4235 2.49217Z"/></svg>`
}
const CSV_FIELDS = ["date", "title", "permalink", "groups", "words"]

class ScrollFileSystem extends TreeFileSystem {
  getScrollFile(filePath) {
    return this._getParsedFile(filePath, ScrollFile)
  }

  parsedFiles = {} // Files parsed by a Tree Language Root Parser
  _getParsedFile(absolutePath, parser) {
    if (this.parsedFiles[absolutePath]) return this.parsedFiles[absolutePath]
    this.parsedFiles[absolutePath] = new parser(undefined, absolutePath, this)
    return this.parsedFiles[absolutePath]
  }

  folderCache = {}
  getScrollFilesInFolder(folderPath) {
    folderPath = Utils.ensureFolderEndsInSlash(folderPath)
    if (this.folderCache[folderPath]) return this.folderCache[folderPath]
    const files = this.list(folderPath)
      .filter(file => file.endsWith(SCROLL_FILE_EXTENSION))
      .map(filePath => this.getScrollFile(filePath))

    this.folderCache[folderPath] = lodash.sortBy(files, file => file.timestamp).reverse()
    return this.folderCache[folderPath]
  }
}

const escapeCommas = str => (typeof str === "string" && str.includes(",") ? `"${str}"` : str)
const defaultScrollParser = new TreeFileSystem().getParser(Disk.getFiles(path.join(__dirname, "grammar")).filter(file => file.endsWith(GRAMMAR_EXTENSION)))
const DefaultScrollParser = defaultScrollParser.parser // todo: remove?

const getGroup = (groupName, files) => files.filter(file => file.shouldBuild && file.groups.includes(groupName))

const parseDataset = content => {
  const parseSchema = tree => {
    const schema = {}
    tree.forEach(node => {
      const word = node.getWord(0)
      if (word.endsWith(":")) schema[word] = node
    })
    return schema
  }
  const conceptDelimiter = /^::/m
  let schema = null
  const concepts = content
    .split(conceptDelimiter)
    .map(section => {
      const str = section.trim()
      const tree = new TreeNode(str)
      if (!schema) {
        schema = parseSchema(tree)
        return null
      } else if (!str.match(/(^|\n)[a-zA-Z0-9_]+: /))
        // A concept must contain at least 1 measurement
        // Strip any blanks
        return null

      const row = {}
      Object.keys(schema).forEach(measure => {
        row[measure.replace(":", "")] = tree.get(measure)
      })

      return row
    })
    .filter(i => i)

  return concepts
}

class ScrollFile {
  constructor(originalScrollCode, absoluteFilePath = "", fileSystem = new ScrollFileSystem({})) {
    this.fileSystem = fileSystem
    if (originalScrollCode === undefined) originalScrollCode = absoluteFilePath ? fileSystem.read(absoluteFilePath) : ""

    this.filePath = absoluteFilePath
    this.filename = path.basename(this.filePath)
    this.folderPath = path.dirname(absoluteFilePath) + "/"
    this.originalScrollCode = originalScrollCode

    // PASS 1: IMPORT PASS
    let afterImportPass = originalScrollCode
    let parser = DefaultScrollParser
    if (absoluteFilePath) {
      const postImport = fileSystem.evaluateImports(absoluteFilePath, defaultScrollParser.grammarCode)
      // Do not build a file marked 'importOnly'
      this.shouldBuild = !postImport.originalFileAsTree.has(scrollKeywords.importOnly)
      afterImportPass = postImport.afterImportPass
      if (postImport.parser) parser = postImport.parser
    }

    // PASS 3: REPLACEMENT PASS. PARSE AND REMOVE VARIABLE DEFINITIONS THEN REPLACE REFERENCES.
    const afterVariablePass = this.evalVariables(afterImportPass)

    // PASS 4: LOAD WITH STD COMPILER OR CUSTOM COMPILER FROM PASS 3
    this.afterVariablePass = afterVariablePass
    this.scrollProgram = new parser(afterVariablePass)

    this.scrollProgram.setFile(this)
    this.timestamp = dayjs(this.scrollProgram.get(scrollKeywords.date) ?? 0).unix()
    this.permalink = this.scrollProgram.get(scrollKeywords.permalink) || (this.filename ? this.filename.replace(SCROLL_FILE_EXTENSION, "") + ".html" : "")
  }

  get allFiles() {
    return this.fileSystem.getScrollFilesInFolder(this.folderPath)
  }

  _dataset
  get dataset() {
    if (this._dataset) return this._dataset
    this._dataset = parseDataset(this.afterVariablePass)
    return this._dataset
  }

  makeDataset(format = "csv") {
    if (format === "json") return JSON.stringify(this.dataset, null, 2)
    const tree = new TreeNode(this.dataset)
    if (format === "csv") return tree.asCsv
    if (format === "tsv") return tree.asTsv
    if (format === "tree") return tree.toString()
    return tree.toString()
  }

  evalVariables(code) {
    const codeAsTree = new TreeNode(code)
    // Process variables
    const varMap = {}
    codeAsTree
      .filter(node => {
        const keyword = node.firstWord
        return keyword === scrollKeywords.replace || keyword === scrollKeywords.replaceDefault || keyword === scrollKeywords.replaceJs || keyword === scrollKeywords.nodejs
      })
      .forEach(node => {
        let value = node.length ? node.childrenToString() : node.getWordsFrom(2).join(" ")
        const kind = node.firstWord
        if (kind === scrollKeywords.replaceJs) value = eval(value)
        if (kind === scrollKeywords.nodejs) {
          const tempPath = this.filePath + ".js"
          if (Disk.exists(tempPath)) throw new Error(`Failed to write/require nodejs snippet since '${tempPath}' already exists.`)
          try {
            Disk.write(tempPath, value)
            const results = require(tempPath)
            Object.keys(results).forEach(key => (varMap[key] = results[key]))
          } catch (err) {
            console.error(err)
          } finally {
            Disk.rm(tempPath)
          }
        } else varMap[node.getWord(1)] = value
        node.destroy() // Destroy definitions after eval
      })

    const keys = Object.keys(varMap)
    if (!keys.length) return code

    let codeAfterVariableSubstitution = codeAsTree.asString
    // Todo: speed up. build a template?
    Object.keys(varMap).forEach(key => (codeAfterVariableSubstitution = codeAfterVariableSubstitution.replace(new RegExp(key, "g"), varMap[key])))

    return codeAfterVariableSubstitution
  }

  get mtimeMs() {
    return this.fileSystem.getMTime(this.filePath)
  }

  SVGS = SVGS
  SCROLL_VERSION = SCROLL_VERSION
  shouldBuild = true
  filePath = ""

  compileStumpCode(code) {
    return new stumpParser(code).compile()
  }

  get git() {
    return this.get(scrollKeywords.git)
  }

  get email() {
    return this.get(scrollKeywords.email)
  }

  get date() {
    return dayjs(this.get(scrollKeywords.date) || 0).format(`MM/DD/YYYY`)
  }

  // Specifically this is the number of words in the source code for a post, not the # of words in the displayed post.
  get words() {
    return this.originalScrollCode.split(/\b/).length
  }

  get hasKeyboardNav() {
    return this.scrollProgram.has(scrollKeywords.keyboardNav)
  }

  get keyboardNavGroup() {
    return this.hasKeyboardNav ? this.primaryGroup.filter(file => file.shouldBuild && file.hasKeyboardNav) : undefined
  }

  nextAndPrevious(arr, item) {
    const current = arr.indexOf(item)
    const nextIndex = current + 1
    const previousIndex = current - 1
    return {
      previous: arr[previousIndex] ?? arr[arr.length - 1],
      next: arr[nextIndex] ?? arr[0]
    }
  }

  get linkToPrevious() {
    const { keyboardNavGroup } = this
    if (!keyboardNavGroup) return undefined
    return this.nextAndPrevious(keyboardNavGroup, this).previous.permalink
  }

  get linkToNext() {
    const { keyboardNavGroup } = this
    if (!keyboardNavGroup) return undefined
    return this.nextAndPrevious(keyboardNavGroup, this).next.permalink
  }

  get canonicalLink() {
    return this.get(scrollKeywords.canonicalLink) || this.baseUrl + this.permalink
  }

  // todo: add an openGraph node type to define this stuff manually
  get openGraphImage() {
    const openGraphImage = this.get(scrollKeywords.openGraphImage)
    if (openGraphImage !== undefined) return openGraphImage

    const node = this.scrollProgram.getNode(scrollKeywords.image)
    if (!node) return ""

    const link = node.content
    return Utils.isAbsoluteUrl(link) ? link : this.baseUrl + link
  }

  // todo: add an openGraph node type to define this stuff manually
  // Use the first thought for the description
  // todo: add a tree method version of get that gets you the first node. (actulaly make get return array?)
  // would speed up a lot.
  get description() {
    const program = this.scrollProgram
    const description = program.get(scrollKeywords.description)
    if (description) return description

    for (let node of program.getTopDownArrayIterator()) {
      if (node.constructor.name !== "titleParser" && node.doesExtend("thoughtParser")) return Utils.stripHtml(node.compile()).replace(/\n/g, " ").replace(/\"/g, "'").substr(0, 300)
    }
    return ""
  }

  get title() {
    return this.scrollProgram.get(scrollKeywords.title) ?? ""
  }

  get(keyword) {
    return this.scrollProgram.get(keyword)
  }

  has(keyword) {
    return this.scrollProgram.has(keyword)
  }

  get viewSourceUrl() {
    const viewSourceUrl = this.get(scrollKeywords.viewSourceUrl)
    if (viewSourceUrl) return viewSourceUrl

    const filename = path.basename(this.filePath)

    const viewSourceBaseUrl = this.get(scrollKeywords.viewSourceBaseUrl)
    return viewSourceBaseUrl ? viewSourceBaseUrl.replace(/\/$/, "") + "/" + filename : filename
  }

  get groups() {
    return this.scrollProgram.get(scrollKeywords.groups) || ""
  }

  get primaryGroup() {
    return getGroup(this.groups.split(" ")[0], this.allFiles)
  }

  getFilesInGroupsForEmbedding(groupNames) {
    let arr = []
    groupNames.forEach(name => {
      if (!name.includes("/"))
        return (arr = arr.concat(
          getGroup(name, this.allFiles).map(file => {
            return { file, relativePath: "" }
          })
        ))
      const parts = name.split("/")
      const group = parts.pop()
      const relativePath = parts.join("/")
      const folderPath = path.join(this.folderPath, path.normalize(relativePath))
      const files = this.fileSystem.getScrollFilesInFolder(folderPath)
      const filtered = getGroup(group, files).map(file => {
        return { file, relativePath: relativePath + "/" }
      })

      arr = arr.concat(filtered)
    })

    return lodash.sortBy(arr, file => file.file.timestamp).reverse()
  }

  get viewSourceHtml() {
    return this.compileStumpCode(`p
 class scrollViewSource
 a View source
  href ${this.viewSourceUrl}`)
  }

  _compiledStandalonePage = ""
  get html() {
    if (!this._compiledStandalonePage) {
      const { permalink } = this
      const content = this.scrollProgram.compile().trim()
      // Don't add html tags to XML/RSS/CSV feeds. A little hacky as calling a getter named _html_ to get _xml_ is not ideal. But
      // <1% of use case so might be good enough.
      const wrapWithHtmlTags = permalink.endsWith(".xml") || permalink.endsWith(".rss") || permalink.endsWith(".csv") || permalink.endsWith(".txt") ? false : true
      this._compiledStandalonePage = wrapWithHtmlTags ? `<!DOCTYPE html><html lang="${this.lang}">` + content + "</html>" : content
    }
    return this._compiledStandalonePage
  }

  // Without specifying the language hyphenation will not work.
  get lang() {
    return this.get("htmlLang") || "en"
  }

  // todo: rename publishedUrl? Or something to indicate that this is only for stuff on the web (not localhost)
  // BaseUrl must be provided for RSS Feeds and OpenGraph tags to work
  // maybe wwwBaseUrl?
  get baseUrl() {
    return (this.scrollProgram.get(scrollKeywords.baseUrl) ?? "").replace(/\/$/, "") + "/"
  }

  csvFields = CSV_FIELDS

  toCsv() {
    return CSV_FIELDS.map(field => escapeCommas(this[field]))
  }

  toRss() {
    const { title, canonicalLink } = this
    return ` <item>
  <title>${title}</title>
  <link>${canonicalLink}</link>
  <pubDate>${dayjs(this.timestamp * 1000).format("ddd, DD MMM YYYY HH:mm:ss ZZ")}</pubDate>
 </item>`
  }
}

class ScrollCli {
  CommandFnDecoratorSuffix = "Command"

  executeUsersInstructionsFromShell(args = [], userIsPipingInput = fs.fstatSync(0).isFIFO()) {
    const command = args[0] // Note: we don't take any parameters on purpose. Simpler UX.
    const commandName = `${command}${this.CommandFnDecoratorSuffix}`
    if (this[commandName]) return userIsPipingInput ? this._runCommandOnPipedStdIn(commandName) : this[commandName](process.cwd())
    else if (command) this.log(`No command '${command}'. Running help command.`)
    else this.log(`No command provided. Running help command.`)
    return this.helpCommand()
  }

  _runCommandOnPipedStdIn(commandName) {
    let pipedData = ""
    process.stdin.on("readable", function () {
      pipedData += this.read() // todo: what's the lambda way to do this?
    })
    process.stdin.on("end", () => {
      const folders = pipedData
        .trim()
        .split("\n")
        .map(line => line.trim())
        .filter(line => fs.existsSync(line))

      folders.forEach(line => this[commandName](line))

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

  logIndent = 0
  log(message) {
    const indent = "    ".repeat(this.logIndent)
    if (this.verbose) console.log(indent + message)
    return message
  }

  get _allCommands() {
    return Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(word => word.endsWith(this.CommandFnDecoratorSuffix))
      .sort()
  }

  async initCommand(cwd) {
    const standardDateFormat = `MM/DD/YYYY`
    const initFolder = {
      ".gitignore": "*.html",
      "header.scroll": `importOnly
git https://github.com/breck7/scroll
email feedback@scroll.pub
baseUrl https://scroll.pub/
metaTags
gazetteCss
pageHeader`,
      "footer.scroll": `importOnly
pageFooter`,
      "firstPost.scroll": `import header.scroll
groups index
${scrollKeywords.title} Hello world
${scrollKeywords.date} ${dayjs().format(standardDateFormat)}

startColumns 2

* This is my first blog post using Scroll. This post will appear in the feed and on the index page.

endColumns
import footer.scroll`,
      "index.scroll": `import header.scroll
title My Personal Blog
description My thoughts about life and the world.
snippets index

import footer.scroll`
    }

    this.log(`Initializing scroll in "${cwd}"`)
    Disk.writeObjectToDisk(cwd, initFolder)
    require("child_process").execSync("git init", { cwd })
    return this.log(`\n👍 Initialized new scroll in '${cwd}'. Build your new site with: scroll build`)
  }

  deleteCommand() {
    return this.log(`\n💡 To delete a Scroll just delete the folder\n`)
  }

  // Normalize 3 possible inputs: 1) cwd of the process 2) provided absolute path 3) cwd of process + provided relative path
  resolvePath(folder = "") {
    return path.isAbsolute(folder) ? path.normalize(folder) : path.resolve(path.join(process.cwd(), folder))
  }

  getErrorsInFolder(folder) {
    const fileSystem = new ScrollFileSystem()
    const folderPath = Utils.ensureFolderEndsInSlash(folder)
    fileSystem.getScrollFilesInFolder(folderPath) // Init all parsers
    const grammarErrors = fileSystem.parsers.map(parser => parser.getAllErrors().map(err => err.toObject())).flat()

    const scrollErrors = fileSystem
      .getScrollFilesInFolder(folderPath)
      .map(file =>
        file.scrollProgram.getAllErrors().map(err => {
          return { filename: file.filename, ...err.toObject() }
        })
      )
      .flat()

    return { grammarErrors, scrollErrors }
  }

  testCommand(cwd) {
    const folder = this.resolvePath(cwd)
    const { grammarErrors, scrollErrors } = this.getErrorsInFolder(folder)
    const grammarMessage = grammarErrors.length ? new TreeNode(grammarErrors).toFormattedTable(200) + "\n" : ""
    if (grammarMessage) this.log(grammarMessage)
    const message = scrollErrors.length ? new TreeNode(scrollErrors).toFormattedTable(60) : "0 errors"
    return this.log(message)
  }

  async buildCommand(cwd) {
    this.buildFilesInFolder(new ScrollFileSystem(), this.resolvePath(cwd))
    return this
  }

  buildFilesInFolder(fileSystem, folder = "/") {
    folder = Utils.ensureFolderEndsInSlash(folder)
    const start = Date.now()
    const files = fileSystem.getScrollFilesInFolder(folder)
    const filesToBuild = files.filter(file => file.shouldBuild)
    this.log(`Building ${filesToBuild.length} files from ${files.length} ${SCROLL_FILE_EXTENSION} files found in '${folder}'\n`)
    this.logIndent++
    const pages = filesToBuild.map(file => {
      const { permalink, html } = file
      fileSystem.write(folder + permalink, html)
      this.log(`💾 Wrote ${file.filename} to ${permalink}`)

      // If this proves useful maybe make slight adjustments to Scroll lang to be more imperative.
      if (file.has(scrollKeywords.writeDataset)) {
        file.scrollProgram.findNodes(scrollKeywords.writeDataset).forEach(node => {
          const link = node.getWord(1) || permalink.replace(".html", ".tsv")

          const extension = link.split(".").pop()
          fileSystem.write(folder + link, file.makeDataset(extension))
          this.log(`💾 Wrote 🔢 in ${file.filename} to ${link}`)
        })
      }

      return { permalink: folder + permalink, html }
    })
    const seconds = (Date.now() - start) / 1000
    this.logIndent--
    this.log(``)
    this.log(`⌛️ Compiled ${pages.length} files to html in ${seconds} seconds. ${lodash.round(pages.length / seconds)} pages per second\n`)

    return pages
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

  helpCommand() {
    this.log(`\n📜📜📜 WELCOME TO SCROLL (v${SCROLL_VERSION}) 📜📜📜`)
    return this.log(`\nThis is the Scroll help page.\n\nCommands you can run from your Scroll's folder:\n\n${this._allCommands.map(comm => `🖌️ ` + comm.replace(this.CommandFnDecoratorSuffix, "")).join("\n")}\n​​`)
  }
}

if (module && !module.parent) new ScrollCli().executeUsersInstructionsFromShell(parseArgs(process.argv.slice(2))._)

module.exports = { ScrollFile, ScrollCli, ScrollFileSystem, DefaultScrollParser }
