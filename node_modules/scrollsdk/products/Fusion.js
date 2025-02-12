const fs = require("fs").promises
const path = require("path")
const { Disk } = require("../products/Disk.node.js")
const { Utils } = require("../products/Utils.js")
const { Particle } = require("../products/Particle.js")
const { HandParsersProgram } = require("../products/Parsers.js")
const parsersParser = require("../products/parsers.nodejs.js")
const { posix } = require("../products/Path.js")
const PARSERS_EXTENSION = ".parsers"
const SCROLL_EXTENSION = ".scroll"
// Add URL regex pattern
const urlRegex = /^https?:\/\/[^ ]+$/i
const parserRegex = /^[a-zA-Z0-9_]+Parser$/gm
const importRegex = /^(import |[a-zA-Z\_\-\.0-9\/]+\.(scroll|parsers)$|https?:\/\/.+\.(scroll|parsers)$)/gm
const importOnlyRegex = /^importOnly/
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
      const stats = await fs.stat(absolutePath)
      const content = await fs.readFile(absolutePath, {
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
    return posix.dirname(path)
  }
  join(...segments) {
    const firstSegment = segments[0]
    if (isUrl(firstSegment)) {
      const baseUrl = firstSegment.endsWith("/") ? firstSegment : firstSegment + "/"
      return new URL(segments.slice(1).join("/"), baseUrl).toString()
    }
    return posix.join(...segments)
  }
}
class EmptyScrollParser extends Particle {
  evalMacros(fusionFile) {
    return fusionFile.fusedCode
  }
  setFile(fusionFile) {
    this.file = fusionFile
  }
}
class FusionFile {
  constructor(codeAtStart, absoluteFilePath = "", fileSystem = new Fusion({})) {
    this.defaultParserCode = ""
    this.defaultParser = EmptyScrollParser
    this.fileSystem = fileSystem
    this.filePath = absoluteFilePath
    this.filename = posix.basename(absoluteFilePath)
    this.folderPath = posix.dirname(absoluteFilePath) + "/"
    this.codeAtStart = codeAtStart
    this.timeIndex = 0
    this.timestamp = 0
    this.importOnly = false
  }
  async readCodeFromStorage() {
    if (this.codeAtStart !== undefined) return this // Code provided
    const { filePath } = this
    if (!filePath) {
      this.codeAtStart = ""
      return this
    }
    this.codeAtStart = await this.fileSystem.read(filePath)
  }
  get isFused() {
    return this.fusedCode !== undefined
  }
  async fuse() {
    // PASS 1: READ FULL FILE
    await this.readCodeFromStorage()
    const { codeAtStart, fileSystem, filePath, defaultParserCode, defaultParser } = this
    // PASS 2: READ AND REPLACE IMPORTs
    let fusedCode = codeAtStart
    let fusedFile
    if (filePath) {
      this.timestamp = await fileSystem.getCTime(filePath)
      fusedFile = await fileSystem.fuseFile(filePath, defaultParserCode)
      this.importOnly = fusedFile.isImportOnly
      fusedCode = fusedFile.fused
      if (fusedFile.footers) fusedCode += "\n" + fusedFile.footers.join("\n")
      this.dependencies = fusedFile.importFilePaths
      this.fusedFile = fusedFile
    }
    this.fusedCode = fusedCode
    const tempProgram = new defaultParser()
    // PASS 3: READ AND REPLACE MACROS. PARSE AND REMOVE MACROS DEFINITIONS THEN REPLACE REFERENCES.
    const codeAfterMacroPass = tempProgram.evalMacros(this)
    this.codeAfterMacroPass = codeAfterMacroPass
    this.parser = (fusedFile === null || fusedFile === void 0 ? void 0 : fusedFile.parser) || defaultParser
    // PASS 4: PARSER WITH CUSTOM PARSER OR STANDARD SCROLL PARSER
    this.scrollProgram = new this.parser(codeAfterMacroPass)
    this.scrollProgram.setFile(this)
    return this
  }
  get formatted() {
    return this.codeAtStart
  }
  async formatAndSave() {
    const { codeAtStart, formatted } = this
    if (codeAtStart === formatted) return false
    await this.fileSystem.write(this.filePath, formatted)
    return true
  }
}
let fusionIdNumber = 0
class Fusion {
  constructor(inMemoryFiles) {
    this.productCache = {}
    this._particleCache = {}
    this._parserCache = {}
    this._parsersExpandersCache = {}
    this._pendingFuseRequests = {}
    this.defaultFileClass = FusionFile
    this.parsedFiles = {}
    this.folderCache = {}
    if (inMemoryFiles) this._storage = new MemoryWriter(inMemoryFiles)
    else this._storage = new DiskWriter()
    fusionIdNumber = fusionIdNumber + 1
    this.fusionId = fusionIdNumber
  }
  async read(absolutePath) {
    return await this._storage.read(absolutePath)
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
    this.productCache[absolutePath] = content
    return await this.write(absolutePath, content)
  }
  async _getFileAsParticles(absoluteFilePathOrUrl) {
    const { _particleCache } = this
    if (_particleCache[absoluteFilePathOrUrl] === undefined) {
      const content = await this._storage.read(absoluteFilePathOrUrl)
      _particleCache[absoluteFilePathOrUrl] = new Particle(content)
    }
    return _particleCache[absoluteFilePathOrUrl]
  }
  getImports(particle, absoluteFilePathOrUrl, importStack) {
    const folder = this.dirname(absoluteFilePathOrUrl)
    const results = particle
      .filter(particle => particle.getLine().match(importRegex))
      .map(async importParticle => {
        const rawPath = importParticle.getLine().replace("import ", "")
        let absoluteImportFilePath = this.join(folder, rawPath)
        if (isUrl(rawPath)) absoluteImportFilePath = rawPath
        else if (isUrl(folder)) absoluteImportFilePath = folder + "/" + rawPath
        if (importStack.includes(absoluteImportFilePath) || absoluteImportFilePath === absoluteFilePathOrUrl) {
          const circularImportError = `Circular import detected: ${[...importStack, absoluteImportFilePath].join(" -> ")}`
          return {
            expandedFile: circularImportError,
            exists: true,
            absoluteImportFilePath,
            importParticle,
            circularImportError,
            lineCount: particle.numberOfLines
          }
        }
        const expandedFile = await this._fuseFile(absoluteImportFilePath, [...importStack, absoluteFilePathOrUrl])
        const exists = await this.exists(absoluteImportFilePath)
        return {
          expandedFile,
          exists,
          absoluteImportFilePath,
          importParticle,
          lineCount: expandedFile.lineCount
        }
      })
    return Promise.all(results)
  }
  async _fuseFile(absoluteFilePathOrUrl, importStack) {
    const { _pendingFuseRequests } = this
    if (_pendingFuseRequests[absoluteFilePathOrUrl]) return _pendingFuseRequests[absoluteFilePathOrUrl]
    _pendingFuseRequests[absoluteFilePathOrUrl] = this._fuseFile2(absoluteFilePathOrUrl, importStack)
    return _pendingFuseRequests[absoluteFilePathOrUrl]
  }
  async _fuseFile2(absoluteFilePathOrUrl, importStack) {
    const [code, exists] = await Promise.all([this.read(absoluteFilePathOrUrl), this.exists(absoluteFilePathOrUrl)])
    const isImportOnly = importOnlyRegex.test(code)
    // Perf hack
    // If its a parsers file, it will have no content, just parsers (and maybe imports).
    // The parsers will already have been processed. We can skip them
    const stripParsers = absoluteFilePathOrUrl.endsWith(PARSERS_EXTENSION)
    let processedCode = stripParsers
      ? code
          .split("\n")
          .filter(line => importRegex.test(line))
          .join("\n")
      : code
    const lineCount = (processedCode.match(/\n/g) || []).length + 1
    let filepathsWithParserDefinitions
    if (await this._doesFileHaveParsersDefinitions(absoluteFilePathOrUrl)) {
      filepathsWithParserDefinitions = [absoluteFilePathOrUrl]
    }
    if (!importRegex.test(processedCode)) {
      return {
        fused: processedCode,
        isImportOnly,
        filepathsWithParserDefinitions,
        exists,
        lineCount
      }
    }
    const particle = new Particle(processedCode)
    // Fetch all imports in parallel
    const imported = await this.getImports(particle, absoluteFilePathOrUrl, importStack)
    // Assemble all imports
    let importFilePaths = []
    let footers
    let hasCircularImportError = false
    imported.forEach(importResults => {
      const { importParticle, absoluteImportFilePath, expandedFile, exists, circularImportError, lineCount } = importResults
      importFilePaths.push(absoluteImportFilePath)
      if (expandedFile.importFilePaths) importFilePaths = importFilePaths.concat(expandedFile.importFilePaths)
      const originalLine = importParticle.getLine()
      importParticle.setLine("imported " + absoluteImportFilePath)
      importParticle.set("exists", `${exists}`)
      importParticle.set("original", `${originalLine}`)
      importParticle.set("lines", `${lineCount}`)
      if (circularImportError) {
        hasCircularImportError = true
        importParticle.set("circularImportError", circularImportError)
      }
      if (expandedFile.footers) footers = (footers || []).concat(expandedFile.footers)
      if (importParticle.has("footer")) {
        footers = footers || []
        footers.push(expandedFile.fused)
      } else importParticle.insertLinesAfter(expandedFile.fused)
    })
    const existStates = await Promise.all(importFilePaths.map(file => this.exists(file)))
    const allImportsExist = !existStates.some(exists => !exists)
    const importFilepathsWithParserDefinitions = (
      await Promise.all(
        importFilePaths.map(async filename => ({
          filename,
          hasParser: await this._doesFileHaveParsersDefinitions(filename)
        }))
      )
    )
      .filter(result => result.hasParser)
      .map(result => result.filename)
    if (importFilepathsWithParserDefinitions.length) {
      filepathsWithParserDefinitions = filepathsWithParserDefinitions || []
      filepathsWithParserDefinitions.concat(importFilepathsWithParserDefinitions)
    }
    return {
      importFilePaths,
      isImportOnly,
      fused: particle.toString(),
      lineCount,
      footers,
      circularImportError: hasCircularImportError,
      exists: allImportsExist,
      filepathsWithParserDefinitions
    }
  }
  async _doesFileHaveParsersDefinitions(absoluteFilePathOrUrl) {
    if (!absoluteFilePathOrUrl) return false
    const { _parsersExpandersCache } = this
    if (_parsersExpandersCache[absoluteFilePathOrUrl] === undefined) {
      const content = await this._storage.read(absoluteFilePathOrUrl)
      _parsersExpandersCache[absoluteFilePathOrUrl] = !!content.match(parserRegex)
    }
    return _parsersExpandersCache[absoluteFilePathOrUrl]
  }
  async _getOneParsersParserFromFiles(filePaths, baseParsersCode) {
    const fileContents = await Promise.all(filePaths.map(async filePath => await this._storage.read(filePath)))
    return Fusion.combineParsers(filePaths, fileContents, baseParsersCode)
  }
  async getParser(filePaths, baseParsersCode = "") {
    const { _parserCache } = this
    const key = filePaths
      .filter(fp => fp)
      .sort()
      .join("\n")
    const hit = _parserCache[key]
    if (hit) return hit
    _parserCache[key] = await this._getOneParsersParserFromFiles(filePaths, baseParsersCode)
    return _parserCache[key]
  }
  static combineParsers(filePaths, fileContents, baseParsersCode = "") {
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
    const sorted = new parsersParser(baseParsersCode + "\n" + asOneFile)._sortParticlesByInScopeOrder()._sortWithParentParsersUpTop()
    const parsersCode = sorted.asString
    return {
      parsersParser: sorted,
      parsersCode,
      parser: new HandParsersProgram(parsersCode).compileAndReturnRootParser()
    }
  }
  get parsers() {
    return Object.values(this._parserCache).map(parser => parser.parsersParser)
  }
  async fuseFile(absoluteFilePathOrUrl, defaultParserCode) {
    const fusedFile = await this._fuseFile(absoluteFilePathOrUrl, [])
    if (!defaultParserCode) return fusedFile
    if (fusedFile.filepathsWithParserDefinitions) {
      const parser = await this.getParser(fusedFile.filepathsWithParserDefinitions, defaultParserCode)
      fusedFile.parser = parser.parser
    }
    return fusedFile
  }
  async getLoadedFile(filePath) {
    return await this._getLoadedFile(filePath, this.defaultFileClass)
  }
  async _getLoadedFile(absolutePath, parser) {
    if (this.parsedFiles[absolutePath]) return this.parsedFiles[absolutePath]
    const file = new parser(undefined, absolutePath, this)
    await file.fuse()
    this.parsedFiles[absolutePath] = file
    return file
  }
  getCachedLoadedFilesInFolder(folderPath, requester) {
    folderPath = Utils.ensureFolderEndsInSlash(folderPath)
    const hit = this.folderCache[folderPath]
    if (!hit) console.log(`Warning: '${folderPath}' not yet loaded in '${this.fusionId}'. Requested by '${requester.filePath}'`)
    return hit || []
  }
  makeSourceMap(fileName, fusedCode) {
    const fileStack = [{ fileName, lineNumber: 0, linesLeft: fusedCode.split("\n").length }]
    return new Particle(fusedCode)
      .map(particle => {
        const currentFile = fileStack[fileStack.length - 1]
        currentFile.lineNumber++
        currentFile.linesLeft--
        if (particle.cue === "imported") {
          const linesLeft = parseInt(particle.get("lines"))
          const original = particle.get("original")
          fileStack.push({ fileName: particle.atoms[1], lineNumber: 0, linesLeft })
          return `${currentFile.fileName}:${currentFile.lineNumber} ${original}\n` + particle.map(line => `${currentFile.fileName}:${currentFile.lineNumber}  ${line}`).join("\n")
        }
        if (!currentFile.linesLeft) fileStack.pop()
        return particle
          .toString()
          .split("\n")
          .map((line, index) => {
            if (index) {
              currentFile.lineNumber++
              currentFile.linesLeft--
            }
            return `${currentFile.fileName}:${currentFile.lineNumber} ${line}`
          })
          .join("\n")
      })
      .join("\n")
  }
  // todo: this is weird. i know we evolved our way here but we should step back and clean this up.
  async getLoadedFilesInFolder(folderPath, extension) {
    folderPath = Utils.ensureFolderEndsInSlash(folderPath)
    if (this.folderCache[folderPath]) return this.folderCache[folderPath]
    const allFiles = await this.list(folderPath)
    const loadedFiles = await Promise.all(allFiles.filter(file => file.endsWith(extension)).map(filePath => this.getLoadedFile(filePath)))
    const sorted = loadedFiles.sort((a, b) => b.timestamp - a.timestamp)
    sorted.forEach((file, index) => (file.timeIndex = index))
    this.folderCache[folderPath] = sorted
    return this.folderCache[folderPath]
  }
}

module.exports = { Fusion, FusionFile }
