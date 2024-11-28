const fs = require("fs")
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
  _read(absolutePath) {
    const { fileCache } = this
    if (!fileCache[absolutePath]) {
      const exists = fs.existsSync(absolutePath)
      if (exists) fileCache[absolutePath] = { absolutePath, exists: true, content: Disk.read(absolutePath).replace(/\r/g, ""), stats: fs.statSync(absolutePath) }
      else fileCache[absolutePath] = { absolutePath, exists: false, content: "", stats: { mtimeMs: 0, ctimeMs: 0 } }
    }
    return fileCache[absolutePath]
  }
  exists(absolutePath) {
    return this._read(absolutePath).exists
  }
  read(absolutePath) {
    return this._read(absolutePath).content
  }
  list(folder) {
    return Disk.getFiles(folder)
  }
  write(fullPath, content) {
    Disk.writeIfChanged(fullPath, content)
  }
  getMTime(absolutePath) {
    return this._read(absolutePath).stats.mtimeMs
  }
  getCTime(absolutePath) {
    return this._read(absolutePath).stats.ctimeMs
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
  read(absolutePath) {
    const value = this.inMemoryFiles[absolutePath]
    if (value === undefined) {
      return ""
    }
    return value
  }
  exists(absolutePath) {
    return this.inMemoryFiles[absolutePath] !== undefined
  }
  write(absolutePath, content) {
    this.inMemoryFiles[absolutePath] = content
  }
  list(absolutePath) {
    return Object.keys(this.inMemoryFiles).filter(filePath => filePath.startsWith(absolutePath) && !filePath.replace(absolutePath, "").includes("/"))
  }
  getMTime() {
    return 1
  }
  getCTime() {
    return 1
  }
  dirname(path) {
    return posix.dirname(path)
  }
  join(...segments) {
    return posix.join(...arguments)
  }
}
class Fusion {
  constructor(inMemoryFiles) {
    this._particleCache = {}
    this._parserCache = {}
    this._expandedImportCache = {}
    this._parsersExpandersCache = {}
    if (inMemoryFiles) this._storage = new MemoryWriter(inMemoryFiles)
    else this._storage = new DiskWriter()
  }
  read(absolutePath) {
    return this._storage.read(absolutePath)
  }
  exists(absolutePath) {
    return this._storage.exists(absolutePath)
  }
  write(absolutePath, content) {
    return this._storage.write(absolutePath, content)
  }
  list(absolutePath) {
    return this._storage.list(absolutePath)
  }
  dirname(absolutePath) {
    return this._storage.dirname(absolutePath)
  }
  join(...segments) {
    return this._storage.join(...segments)
  }
  getMTime(absolutePath) {
    return this._storage.getMTime(absolutePath)
  }
  getCTime(absolutePath) {
    return this._storage.getMTime(absolutePath)
  }
  _getFileAsParticles(absoluteFilePath) {
    const { _particleCache } = this
    if (_particleCache[absoluteFilePath] === undefined) {
      _particleCache[absoluteFilePath] = new Particle(this._storage.read(absoluteFilePath))
    }
    return _particleCache[absoluteFilePath]
  }
  _fuseFile(absoluteFilePath) {
    const { _expandedImportCache } = this
    if (_expandedImportCache[absoluteFilePath]) return _expandedImportCache[absoluteFilePath]
    let code = this.read(absoluteFilePath)
    const exists = this.exists(absoluteFilePath)
    const isImportOnly = importOnlyRegex.test(code)
    // Perf hack
    // If its a parsers file, it will have no content, just parsers (and maybe imports).
    // The parsers will already have been processed. We can skip them
    const stripParsers = absoluteFilePath.endsWith(PARSERS_EXTENSION)
    if (stripParsers)
      code = code
        .split("\n")
        .filter(line => importRegex.test(line))
        .join("\n")
    const filepathsWithParserDefinitions = []
    if (this._doesFileHaveParsersDefinitions(absoluteFilePath)) filepathsWithParserDefinitions.push(absoluteFilePath)
    if (!importRegex.test(code))
      return {
        fused: code,
        footers: [],
        isImportOnly,
        importFilePaths: [],
        filepathsWithParserDefinitions,
        exists
      }
    let importFilePaths = []
    let footers = []
    const particle = new Particle(code)
    const folder = this.dirname(absoluteFilePath)
    particle
      .filter(particle => particle.getLine().match(importRegex))
      .forEach(importParticle => {
        const relativeFilePath = importParticle.getLine().replace("import ", "")
        const absoluteImportFilePath = this.join(folder, relativeFilePath)
        const expandedFile = this._fuseFile(absoluteImportFilePath)
        importFilePaths.push(absoluteImportFilePath)
        importFilePaths = importFilePaths.concat(expandedFile.importFilePaths)
        const exists = this.exists(absoluteImportFilePath)
        importParticle.setLine("imported " + relativeFilePath)
        importParticle.set("exists", `${exists}`)
        footers = footers.concat(expandedFile.footers)
        if (importParticle.has("footer")) footers.push(expandedFile.fused)
        else importParticle.insertLinesAfter(expandedFile.fused)
      })
    _expandedImportCache[absoluteFilePath] = {
      importFilePaths,
      isImportOnly,
      fused: particle.toString(),
      footers,
      exists: !importFilePaths.some(file => !this.exists(file)),
      filepathsWithParserDefinitions: importFilePaths.filter(filename => this._doesFileHaveParsersDefinitions(filename)).concat(filepathsWithParserDefinitions)
    }
    return _expandedImportCache[absoluteFilePath]
  }
  _doesFileHaveParsersDefinitions(absoluteFilePath) {
    if (!absoluteFilePath) return false
    const { _parsersExpandersCache } = this
    if (_parsersExpandersCache[absoluteFilePath] === undefined) _parsersExpandersCache[absoluteFilePath] = !!this._storage.read(absoluteFilePath).match(parserRegex)
    return _parsersExpandersCache[absoluteFilePath]
  }
  _getOneParsersParserFromFiles(filePaths, baseParsersCode) {
    const parserDefinitionRegex = /^[a-zA-Z0-9_]+Parser$/
    const atomDefinitionRegex = /^[a-zA-Z0-9_]+Atom/
    const asOneFile = filePaths
      .map(filePath => {
        const content = this._storage.read(filePath)
        if (filePath.endsWith(PARSERS_EXTENSION)) return content
        // Strip scroll content
        return new Particle(content)
          .filter(particle => particle.getLine().match(parserDefinitionRegex) || particle.getLine().match(atomDefinitionRegex))
          .map(particle => particle.asString)
          .join("\n")
      })
      .join("\n")
      .trim()
    // todo: clean up scrollsdk so we are using supported methods (perhaps add a formatOptions that allows you to tell Parsers not to run prettier on js particles)
    return new parsersParser(baseParsersCode + "\n" + asOneFile)._sortParticlesByInScopeOrder()._sortWithParentParsersUpTop()
  }
  get parsers() {
    return Object.values(this._parserCache).map(parser => parser.parsersParser)
  }
  getParser(filePaths, baseParsersCode = "") {
    const { _parserCache } = this
    const key = filePaths
      .filter(fp => fp)
      .sort()
      .join("\n")
    const hit = _parserCache[key]
    if (hit) return hit
    const parsersParser = this._getOneParsersParserFromFiles(filePaths, baseParsersCode)
    const parsersCode = parsersParser.asString
    _parserCache[key] = {
      parsersParser,
      parsersCode,
      parser: new HandParsersProgram(parsersCode).compileAndReturnRootParser()
    }
    return _parserCache[key]
  }
  fuseFile(absoluteFilePath, defaultParserCode) {
    const fusedFile = this._fuseFile(absoluteFilePath)
    if (!defaultParserCode) return fusedFile
    // BUILD CUSTOM COMPILER, IF THERE ARE CUSTOM PARSERS NODES DEFINED
    if (fusedFile.filepathsWithParserDefinitions.length) fusedFile.parser = this.getParser(fusedFile.filepathsWithParserDefinitions, defaultParserCode).parser
    return fusedFile
  }
}

module.exports = { Fusion }
