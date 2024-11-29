const fs = require("fs").promises // Change to use promises version
const path = require("path")
const { Disk } = require("../products/Disk.node.js")
const { Utils } = require("../products/Utils.js")
const { Particle } = require("../products/Particle.js")
const { HandParsersProgram } = require("../products/Parsers.js")
const parsersParser = require("../products/parsers.nodejs.js")
const { posix } = require("../products/Path.js")
const PARSERS_EXTENSION = ".parsers"
const parserRegex = /^[a-zA-Z0-9_]+Parser$/gm
// A regex to check if a multiline string has an import line.
const importRegex = /^(import |[a-zA-Z\_\-\.0-9\/]+\.(scroll|parsers)$)/gm
const importOnlyRegex = /^importOnly/
class DiskWriter {
  constructor() {
    this.fileCache = {}
  }
  async _read(absolutePath) {
    const { fileCache } = this
    if (!fileCache[absolutePath]) {
      const exists = await fs
        .access(absolutePath)
        .then(() => true)
        .catch(() => false)
      if (exists) {
        const [content, stats] = await Promise.all([fs.readFile(absolutePath, "utf8").then(content => content.replace(/\r/g, "")), fs.stat(absolutePath)])
        fileCache[absolutePath] = { absolutePath, exists: true, content, stats }
      } else {
        fileCache[absolutePath] = { absolutePath, exists: false, content: "", stats: { mtimeMs: 0, ctimeMs: 0 } }
      }
    }
    return fileCache[absolutePath]
  }
  async exists(absolutePath) {
    const file = await this._read(absolutePath)
    return file.exists
  }
  async read(absolutePath) {
    const file = await this._read(absolutePath)
    return file.content
  }
  async list(folder) {
    return Disk.getFiles(folder)
  }
  async write(fullPath, content) {
    Disk.writeIfChanged(fullPath, content)
  }
  async getMTime(absolutePath) {
    const file = await this._read(absolutePath)
    return file.stats.mtimeMs
  }
  async getCTime(absolutePath) {
    const file = await this._read(absolutePath)
    return file.stats.ctimeMs
  }
  dirname(absolutePath) {
    return path.dirname(absolutePath)
  }
  join(...segments) {
    return path.join(...arguments)
  }
}
class MemoryWriter {
  constructor(inMemoryFiles) {
    this.inMemoryFiles = inMemoryFiles
  }
  async read(absolutePath) {
    const value = this.inMemoryFiles[absolutePath]
    if (value === undefined) {
      return ""
    }
    return value
  }
  async exists(absolutePath) {
    return this.inMemoryFiles[absolutePath] !== undefined
  }
  async write(absolutePath, content) {
    this.inMemoryFiles[absolutePath] = content
  }
  async list(absolutePath) {
    return Object.keys(this.inMemoryFiles).filter(filePath => filePath.startsWith(absolutePath) && !filePath.replace(absolutePath, "").includes("/"))
  }
  async getMTime() {
    return 1
  }
  async getCTime() {
    return 1
  }
  dirname(path) {
    return posix.dirname(path)
  }
  join(...segments) {
    return posix.join(...arguments)
  }
}
class FusionFile {
  constructor(codeAtStart, absoluteFilePath = "", fileSystem = new Fusion({})) {
    this.defaultParserCode = ""
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
    const { codeAtStart, fileSystem, filePath, defaultParserCode } = this
    // PASS 2: READ AND REPLACE IMPORTs
    let fusedCode = codeAtStart
    if (filePath) {
      this.timestamp = await fileSystem.getCTime(filePath)
      const fusedFile = await fileSystem.fuseFile(filePath, defaultParserCode)
      this.importOnly = fusedFile.isImportOnly
      fusedCode = fusedFile.fused
      if (fusedFile.footers.length) fusedCode += "\n" + fusedFile.footers.join("\n")
      this.dependencies = fusedFile.importFilePaths
      this.fusedFile = fusedFile
    }
    this.fusedCode = fusedCode
    this.parseCode()
    return this
  }
  parseCode() {}
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
    this._expandedImportCache = {}
    this._parsersExpandersCache = {}
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
  async _getFileAsParticles(absoluteFilePath) {
    const { _particleCache } = this
    if (_particleCache[absoluteFilePath] === undefined) {
      const content = await this._storage.read(absoluteFilePath)
      _particleCache[absoluteFilePath] = new Particle(content)
    }
    return _particleCache[absoluteFilePath]
  }
  async _fuseFile(absoluteFilePath) {
    const { _expandedImportCache } = this
    if (_expandedImportCache[absoluteFilePath]) return _expandedImportCache[absoluteFilePath]
    const [code, exists] = await Promise.all([this.read(absoluteFilePath), this.exists(absoluteFilePath)])
    const isImportOnly = importOnlyRegex.test(code)
    // Perf hack
    // If its a parsers file, it will have no content, just parsers (and maybe imports).
    // The parsers will already have been processed. We can skip them
    const stripParsers = absoluteFilePath.endsWith(PARSERS_EXTENSION)
    const processedCode = stripParsers
      ? code
          .split("\n")
          .filter(line => importRegex.test(line))
          .join("\n")
      : code
    const filepathsWithParserDefinitions = []
    if (await this._doesFileHaveParsersDefinitions(absoluteFilePath)) {
      filepathsWithParserDefinitions.push(absoluteFilePath)
    }
    if (!importRegex.test(processedCode)) {
      return {
        fused: processedCode,
        footers: [],
        isImportOnly,
        importFilePaths: [],
        filepathsWithParserDefinitions,
        exists
      }
    }
    const particle = new Particle(processedCode)
    const folder = this.dirname(absoluteFilePath)
    // Fetch all imports in parallel
    const importParticles = particle.filter(particle => particle.getLine().match(importRegex))
    const importResults = importParticles.map(async importParticle => {
      const relativeFilePath = importParticle.getLine().replace("import ", "")
      const absoluteImportFilePath = this.join(folder, relativeFilePath)
      // todo: race conditions
      const [expandedFile, exists] = await Promise.all([this._fuseFile(absoluteImportFilePath), this.exists(absoluteImportFilePath)])
      return {
        expandedFile,
        exists,
        relativeFilePath,
        absoluteImportFilePath,
        importParticle
      }
    })
    const imported = await Promise.all(importResults)
    // Assemble all imports
    let importFilePaths = []
    let footers = []
    imported.forEach(importResults => {
      const { importParticle, absoluteImportFilePath, expandedFile, relativeFilePath, exists } = importResults
      importFilePaths.push(absoluteImportFilePath)
      importFilePaths = importFilePaths.concat(expandedFile.importFilePaths)
      importParticle.setLine("imported " + relativeFilePath)
      importParticle.set("exists", `${exists}`)
      footers = footers.concat(expandedFile.footers)
      if (importParticle.has("footer")) footers.push(expandedFile.fused)
      else importParticle.insertLinesAfter(expandedFile.fused)
    })
    const existStates = await Promise.all(importFilePaths.map(file => this.exists(file)))
    const allImportsExist = !existStates.some(exists => !exists)
    _expandedImportCache[absoluteFilePath] = {
      importFilePaths,
      isImportOnly,
      fused: particle.toString(),
      footers,
      exists: allImportsExist,
      filepathsWithParserDefinitions: (
        await Promise.all(
          importFilePaths.map(async filename => ({
            filename,
            hasParser: await this._doesFileHaveParsersDefinitions(filename)
          }))
        )
      )
        .filter(result => result.hasParser)
        .map(result => result.filename)
        .concat(filepathsWithParserDefinitions)
    }
    return _expandedImportCache[absoluteFilePath]
  }
  async _doesFileHaveParsersDefinitions(absoluteFilePath) {
    if (!absoluteFilePath) return false
    const { _parsersExpandersCache } = this
    if (_parsersExpandersCache[absoluteFilePath] === undefined) {
      const content = await this._storage.read(absoluteFilePath)
      _parsersExpandersCache[absoluteFilePath] = !!content.match(parserRegex)
    }
    return _parsersExpandersCache[absoluteFilePath]
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
  async fuseFile(absoluteFilePath, defaultParserCode) {
    const fusedFile = await this._fuseFile(absoluteFilePath)
    if (!defaultParserCode) return fusedFile
    if (fusedFile.filepathsWithParserDefinitions.length) {
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
