// todo: as much as we can, remove ScrollFileSystem and move these capabilities into the root Particle class.
const fsp = require("fs").promises
const path = require("path")
const { Disk } = require("../products/Disk.node.js")
const { Utils } = require("../products/Utils.js")
const { Particle } = require("../products/Particle.js")
const { HandParsersProgram } = require("../products/Parsers.js")
const parsersParser = require("../products/parsers.nodejs.js")
const PARSERS_EXTENSION = ".parsers"
const SCROLL_EXTENSION = ".scroll"
// Add URL regex pattern
const urlRegex = /^https?:\/\/[^ ]+$/i
const isUrl = path => urlRegex.test(path)
// URL content cache with pending requests tracking
const urlCache = {}
const pendingRequests = {}
async function fetchWithCache(url) {
  const now = Date.now()
  const cached = urlCache[url]
  if (cached) return cached
  // If there's already a pending request for this URL, return that promise
  if (pendingRequests[url]) {
    return pendingRequests[url]
  }
  // Create new request and store in pending
  const requestPromise = (async () => {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const content = await response.text()
      const result = {
        content,
        timestamp: now,
        exists: true
      }
      urlCache[url] = result
      return result
    } catch (error) {
      console.error(`Error fetching ${url}:`, error)
      const result = {
        content: "",
        timestamp: now,
        exists: false
      }
      urlCache[url] = result
      return result
    } finally {
      delete pendingRequests[url]
    }
  })()
  pendingRequests[url] = requestPromise
  return requestPromise
}
class DiskWriter {
  constructor() {
    this.fileCache = {}
  }
  async _read(absolutePath) {
    if (isUrl(absolutePath)) {
      const result = await fetchWithCache(absolutePath)
      return {
        absolutePath,
        exists: result.exists,
        content: result.content,
        stats: { mtimeMs: Date.now(), ctimeMs: Date.now() }
      }
    }
    const { fileCache } = this
    if (fileCache[absolutePath]) return fileCache[absolutePath]
    try {
      const stats = await fsp.stat(absolutePath)
      const content = await fsp.readFile(absolutePath, {
        encoding: "utf8",
        flag: "r" // explicit read flag
      })
      const normalizedContent = content.includes("\r") ? content.replace(/\r/g, "") : content
      fileCache[absolutePath] = {
        absolutePath,
        exists: true,
        content: normalizedContent,
        stats
      }
    } catch (error) {
      fileCache[absolutePath] = {
        absolutePath,
        exists: false,
        content: "",
        stats: { mtimeMs: 0, ctimeMs: 0 }
      }
    }
    return fileCache[absolutePath]
  }
  async exists(absolutePath) {
    if (isUrl(absolutePath)) {
      const result = await fetchWithCache(absolutePath)
      return result.exists
    }
    const file = await this._read(absolutePath)
    return file.exists
  }
  async read(absolutePath) {
    const file = await this._read(absolutePath)
    return file.content
  }
  async createReadStream(absolutePath) {
    const fd = await fsp.open(absolutePath)
    return fd.createReadStream({
      encoding: "utf8"
    })
  }
  async list(folder) {
    if (isUrl(folder)) {
      return [] // URLs don't support directory listing
    }
    return Disk.getFiles(folder)
  }
  async write(fullPath, content) {
    if (isUrl(fullPath)) {
      throw new Error("Cannot write to URL")
    }
    Disk.writeIfChanged(fullPath, content)
  }
  async getMTime(absolutePath) {
    if (isUrl(absolutePath)) {
      const cached = urlCache[absolutePath]
      return cached ? cached.timestamp : Date.now()
    }
    const file = await this._read(absolutePath)
    return file.stats.mtimeMs
  }
  async getCTime(absolutePath) {
    if (isUrl(absolutePath)) {
      const cached = urlCache[absolutePath]
      return cached ? cached.timestamp : Date.now()
    }
    const file = await this._read(absolutePath)
    return file.stats.ctimeMs
  }
  dirname(absolutePath) {
    if (isUrl(absolutePath)) {
      return absolutePath.substring(0, absolutePath.lastIndexOf("/"))
    }
    return path.dirname(absolutePath)
  }
  join(...segments) {
    const firstSegment = segments[0]
    if (isUrl(firstSegment)) {
      // For URLs, we need to handle joining differently
      const baseUrl = firstSegment.endsWith("/") ? firstSegment : firstSegment + "/"
      return new URL(segments.slice(1).join("/"), baseUrl).toString()
    }
    return path.join(...segments)
  }
}
// Update MemoryWriter to support URLs
class MemoryWriter {
  constructor(inMemoryFiles) {
    this.inMemoryFiles = inMemoryFiles
  }
  async read(absolutePath) {
    if (isUrl(absolutePath)) {
      const result = await fetchWithCache(absolutePath)
      return result.content
    }
    const value = this.inMemoryFiles[absolutePath]
    if (value === undefined) {
      return ""
    }
    return value
  }
  async createReadStream(absolutePath) {
    return await this.read(absolutePath)
  }
  async exists(absolutePath) {
    if (isUrl(absolutePath)) {
      const result = await fetchWithCache(absolutePath)
      return result.exists
    }
    return this.inMemoryFiles[absolutePath] !== undefined
  }
  async write(absolutePath, content) {
    if (isUrl(absolutePath)) {
      throw new Error("Cannot write to URL")
    }
    this.inMemoryFiles[absolutePath] = content
  }
  async list(absolutePath) {
    if (isUrl(absolutePath)) {
      return []
    }
    return Object.keys(this.inMemoryFiles).filter(filePath => filePath.startsWith(absolutePath) && !filePath.replace(absolutePath, "").includes("/"))
  }
  async getMTime(absolutePath) {
    if (isUrl(absolutePath)) {
      const cached = urlCache[absolutePath]
      return cached ? cached.timestamp : Date.now()
    }
    return 1
  }
  async getCTime(absolutePath) {
    if (isUrl(absolutePath)) {
      const cached = urlCache[absolutePath]
      return cached ? cached.timestamp : Date.now()
    }
    return 1
  }
  dirname(path) {
    if (isUrl(path)) {
      return path.substring(0, path.lastIndexOf("/"))
    }
    return Utils.posix.dirname(path)
  }
  join(...segments) {
    const firstSegment = segments[0]
    if (isUrl(firstSegment)) {
      const baseUrl = firstSegment.endsWith("/") ? firstSegment : firstSegment + "/"
      return new URL(segments.slice(1).join("/"), baseUrl).toString()
    }
    return Utils.posix.join(...segments)
  }
}
class ScrollFile {
  constructor(codeAtStart, absoluteFilePath = "", fileSystem = new ScrollFileSystem({})) {
    this.exists = true
    this.fileSystem = fileSystem
    this.filePath = absoluteFilePath
    this.codeAtStart = codeAtStart
    this.timestamp = 0
    this.scrollProgram = new fileSystem.defaultParser(undefined, absoluteFilePath)
    this.scrollProgram.setFile(this)
  }
  async _readCodeFromStorage() {
    if (this.codeAtStart !== undefined) return this // Code provided
    const { filePath } = this
    if (!filePath) {
      this.codeAtStart = ""
      return this
    }
    this.codeAtStart = await this.fileSystem.read(filePath)
  }
  async singlePassFuse() {
    if (!this._fuseRequest) this._fuseRequest = this._singlePassFuse()
    return await this._fuseRequest
  }
  async _singlePassFuse() {
    const { fileSystem, filePath, codeAtStart } = this
    if (codeAtStart !== undefined) {
      await this.scrollProgram.appendFromStream(codeAtStart)
    } else {
      if (!(await fileSystem.exists(filePath))) {
        this.exists = false
        this.isFused = true
        return this
      }
      this.timestamp = await fileSystem.getCTime(filePath)
      const stream = await fileSystem.createReadStream(filePath)
      await this.scrollProgram.appendFromStream(stream)
    }
    this.scrollProgram.wake()
    // What happens if we encounter a new parser?
    // very frequently if we encounter 1 parser we will encounter a sequence of parsers so
    // perhaps on wake, for now, we switch into collecting parsers mode
    // and then when we hit a non parser, only at that moment do we recompile the parsers
  }
}
let scrollFileSystemIdNumber = 0
class ScrollFileSystem {
  constructor(inMemoryFiles, standardParserDirectory) {
    this.defaultParserCode = ""
    this.defaultParser = Particle
    this.defaultFileClass = ScrollFile
    this.productCache = []
    this._parserCache = {}
    this._fusedFiles = {}
    this._folderCache = {}
    if (inMemoryFiles) this._storage = new MemoryWriter(inMemoryFiles)
    else this._storage = new DiskWriter()
    scrollFileSystemIdNumber = scrollFileSystemIdNumber + 1
    this.scrollFileSystemIdNumber = scrollFileSystemIdNumber
    this.standardParserDirectory = standardParserDirectory
    if (standardParserDirectory) this._loadDefaultParser()
  }
  newFile(codeAtStart, absoluteFilePath) {
    return new this.defaultFileClass(codeAtStart, absoluteFilePath, this)
  }
  _loadDefaultParser() {
    const { standardParserDirectory } = this
    const defaultParserFiles = Disk.getFiles(standardParserDirectory).filter(file => file.endsWith(PARSERS_EXTENSION))
    this._setDefaultParser(
      standardParserDirectory,
      defaultParserFiles,
      defaultParserFiles.map(filePath => Disk.read(filePath))
    )
    return this
  }
  _setDefaultParser(standardParserDirectory, defaultParserFiles, contents) {
    const defaultParser = ScrollFileSystem._combineParsers(defaultParserFiles, contents)
    this.defaultParserCode = defaultParser.parsersCode
    this.defaultParser = defaultParser.parser
  }
  async read(absolutePath) {
    return await this._storage.read(absolutePath)
  }
  async createReadStream(absolutePath) {
    return await this._storage.createReadStream(absolutePath)
  }
  async exists(absolutePath) {
    return await this._storage.exists(absolutePath)
  }
  async write(absolutePath, content) {
    return await this._storage.write(absolutePath, content)
  }
  async list(absolutePath) {
    return await this._storage.list(absolutePath)
  }
  dirname(absolutePath) {
    return this._storage.dirname(absolutePath)
  }
  join(...segments) {
    return this._storage.join(...segments)
  }
  async getMTime(absolutePath) {
    return await this._storage.getMTime(absolutePath)
  }
  async getCTime(absolutePath) {
    return await this._storage.getCTime(absolutePath)
  }
  async writeProduct(absolutePath, content) {
    this.productCache.push(absolutePath)
    return await this.write(absolutePath, content)
  }
  makeRelativePath(importer, importee) {
    const folder = this.dirname(importer)
    let absoluteImportFilePath = this.join(folder, importee)
    if (isUrl(importee)) absoluteImportFilePath = importee
    else if (isUrl(folder)) absoluteImportFilePath = folder + "/" + importee
    return absoluteImportFilePath
  }
  static sortParsers(code) {
    return new parsersParser(code)._sortParticlesByInScopeOrder()._sortWithParentParsersUpTop()
  }
  static _combineParsers(filePaths, fileContents, baseParsersCode = "") {
    const parserDefinitionRegex = /^[a-zA-Z0-9_]+Parser$/
    const atomDefinitionRegex = /^[a-zA-Z0-9_]+Atom/
    const mapped = fileContents.map((content, index) => {
      const filePath = filePaths[index]
      if (filePath.endsWith(PARSERS_EXTENSION)) return content
      return new Particle(content)
        .filter(particle => particle.getLine().match(parserDefinitionRegex) || particle.getLine().match(atomDefinitionRegex))
        .map(particle => particle.asString)
        .join("\n")
    })
    const asOneFile = mapped.join("\n").trim()
    const sorted = this.sortParsers(baseParsersCode + "\n" + asOneFile)
    const parsersCode = sorted.asString
    return {
      parsersParser: sorted,
      parsersCode,
      parser: new HandParsersProgram(parsersCode).compileAndReturnRootParser()
    }
  }
  setDefaultParserFromString(contents) {
    this._setDefaultParser("", ["scroll"], [contents])
  }
  async getFusedFile(absolutePath) {
    const file = await this.getFile(absolutePath)
    await file.singlePassFuse()
    return file
  }
  async getFile(absolutePath) {
    if (this._fusedFiles[absolutePath]) return this._fusedFiles[absolutePath]
    const file = new ScrollFile(undefined, absolutePath, this)
    this._fusedFiles[absolutePath] = file
    return file
  }
  getFusedFilesInFolderIfCached(folderPath, requester) {
    folderPath = Utils.ensureFolderEndsInSlash(folderPath)
    const hit = this._folderCache[folderPath]
    if (!hit) console.log(`Warning: '${folderPath}' not yet loaded in '${this.scrollFileSystemIdNumber}'. Requested by '${requester.filePath}'`)
    return hit || []
  }
  // todo: this is weird. i know we evolved our way here but we should step back and clean this up.
  async getFusedFilesInFolder(folderPath, extension) {
    folderPath = Utils.ensureFolderEndsInSlash(folderPath)
    if (this._folderCache[folderPath]) return this._folderCache[folderPath]
    const allFiles = (await this.list(folderPath)).filter(file => file.endsWith(extension))
    const loadedFiles = []
    for (let filePath of allFiles) {
      loadedFiles.push(await this.getFusedFile(filePath))
    }
    this._folderCache[folderPath] = loadedFiles
    return this._folderCache[folderPath]
  }
}

module.exports = { ScrollFileSystem, ScrollFile }
