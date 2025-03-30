#! /usr/bin/env node

const tap = require("tap")
const fs = require("fs")
const path = require("path")
const { Particle } = require("scrollsdk/products/Particle.js")
const { ScrollCli } = require("../scroll.js")
const { ScrollSetCLI } = require("../ScrollSetCLI.js")
const { Disk } = require("scrollsdk/products/Disk.node.js")
const { TestRacer } = require("scrollsdk/products/TestRacer.js")
const parsersParser = require("scrollsdk/products/parsers.nodejs.js")
const shell = require("child_process").execSync

const testParticles = {}

const testsFolder = path.join(__dirname)
const stampFolder = path.join(testsFolder, "testOutput")
const cli = new ScrollCli()
const ScrollFile = cli.sfs.defaultFileClass

// cleanup in case it was built earlier:
if (Disk.exists(stampFolder)) fs.rmSync(stampFolder, { recursive: true })

testParticles.compileAftertext = async areEqual => {
  const tests = [
    {
      text: `* Hello brave new world
 link home.com new
 bold brave new
 underline new world
 strike wor`,
      expected: `<p id="particle0" class="scrollParagraph">Hello <b>brave <u><a href="home.com">new</a></b> <s>wor</s>ld</u></p>`
    }
  ]

  tests.forEach(async example => {
    const result = await cli.scrollToHtml(example.text)
    areEqual(result, example.expected)
  })
}

testParticles.scrollParagraphParser = async areEqual => {
  // Arrange/Act
  const program = await cli.scrollToHtml(`* foo`)
  // Assert
  areEqual(program, `<p id="particle0" class="scrollParagraph">foo</p>`)
}

testParticles.linkOnly = async areEqual => {
  // Arrange/Act
  const program = await cli.scrollToHtml(`* https://particles.scroll.pub`)
  // Assert
  areEqual(program, `<p id="particle0" class="scrollParagraph"><a href="https://particles.scroll.pub" target="_blank">https://particles.scroll.pub</a></p>`)
}

testParticles.endSnippet = async areEqual => {
  // Arrange/Act
  const program = await cli.scrollToHtml(`Hi\nendSnippet`)
  // Assert
  areEqual(program.includes("endSnippet"), false, "should not print endSnippet")
}

testParticles.tableWithLinks = async areEqual => {
  const tests = [
    {
      text: `datatable
 delimiter ,
 printTable
 data
  name,nameLink
  Wikipedia,https://wikipedia.org`,
      contains: `<a href="https://wikipedia.org">`
    }
  ]

  tests.forEach(async example => {
    const result = await cli.scrollToHtml(example.text)
    areEqual(result.includes(example.contains), true)
  })
}

testParticles.test = async areEqual => {
  const cli = new ScrollCli()
  cli.verbose = false
  const result = await cli.testCommand()
  areEqual(result.includes("0 errors"), true)
}

testParticles.testAllScrollsInThisRepo = async areEqual => {
  const cli = new ScrollCli()
  cli.verbose = false
  const result = await cli.listCommand(path.join(__dirname, ".."))
  const dirs = Object.keys(result)
  for (let dir of dirs) {
    const result = await cli.testCommand(dir)
    areEqual(result.includes("0 errors"), true, `No errors in '${dir}'`)
  }
}

testParticles.inMemoryFileSystem = async areEqual => {
  // You could get all in folders with lodash.unique(Object.keys(this.files).map(filename => path.dirname(filename)))

  // Arrange
  const files = {
    "/header.scroll": "settings.scroll",
    "/settings.scroll": "* This should be imported",
    "/pages/about.scroll": `../header.scroll\ntitle About us
pParser
 extends scrollParagraphParser
 cue p
p A custom parser
buildHtml`
  }
  // Act
  const cli = new ScrollCli().silence()
  cli.initFs(files)
  await cli.buildFilesInFolder("/")
  await cli.buildFilesInFolder("/pages/")

  // Assert
  areEqual(files["/pages/about.html"].includes("This should be imported"), true, "In memory file system worked")
  areEqual(files["/pages/about.html"].includes(`<html lang="en">`), true, "HTML tag and lang attribute set to ensure hyphenation will work.")
}

testParticles.file = async areEqual => {
  const rootFolder = path.join(__dirname, "..")
  const cli = new ScrollCli().silence()
  const files = await cli.sfs.getFusedFilesInFolder(rootFolder, ".scroll")
  const releaseNotesFile = files.find(file => file.scrollProgram.permalink === "releaseNotes.html").scrollProgram

  areEqual(releaseNotesFile.permalink, "releaseNotes.html")
  areEqual(releaseNotesFile.asHtml.includes("Scroll the language is now called"), true)
  areEqual(releaseNotesFile.description, "A list of what has changed in Scroll releases.", "Meta description auto-generated if not specified.")
  areEqual(files[4].scrollProgram.permalink.endsWith(".html"), true)
}

testParticles.ensureNoErrorsInParser = async areEqual => {
  const DefaultScrollParser = cli.sfs.defaultParser.parser
  const parserErrors = new parsersParser(new DefaultScrollParser().definition.asString).getAllErrors().map(err => err.toObject())
  if (parserErrors.length) console.log(parserErrors)
  areEqual(parserErrors.length, 0, "no errors in scroll standard library parsers")
}

testParticles.cli = async areEqual => {
  const cli = new ScrollCli()
  cli.verbose = false
  // Act/Assert
  areEqual(cli.helpCommand().includes("Available commands"), true)

  // Act/Assert
  areEqual(cli.deleteCommand().includes("delete"), true)

  // Act/Assert
  const result = await cli.buildCommand()
  areEqual(!!result, true)

  // Act/Assert
  const res2 = await cli.executeUsersInstructionsFromShell(["help"], false)
  areEqual(res2.includes("Available commands"), true)

  // Act
  const results = cli.findScrollsInDirRecursive(__dirname)
  // Assert
  areEqual(JSON.stringify(results).includes("scrollFileCount"), true, "list works")
}

testParticles.standalonePage = async areEqual => {
  // Arrange
  const page = new ScrollFile(`title A standalone page
printTitle
* Blue sky`)
  // Act/Assert
  await page.singlePassFuse()
  const { asHtml, asTxt } = page.scrollProgram
  areEqual(asHtml.includes("Blue sky"), true)
  areEqual(asTxt.includes("A standalone page"), true)
}

testParticles.aBlankPage = async areEqual => {
  // Arrange/Act
  const html = await cli.scrollToHtml("")
  // Assert
  areEqual(html, ``)

  // Arrange
  const testHidden = await cli.scrollToHtml(`permalink blank.html
# Hello world
 hidden`)
  // Act/Assert
  areEqual(testHidden, `<!DOCTYPE html>\n<html lang="en">\n<body>\n\n</body>\n</html>`)
}

testParticles.baseUrl = async areEqual => {
  // Arrange
  const page = await cli.scrollToHtml(`baseUrl http://test.com/
metaTags
blog/screenshot.png`)
  // Act/Assert
  areEqual(page.includes("http://test.com/blog/screenshot.png"), true)
}

testParticles.scrollsetCli = areEqual => {
  // Arrange
  class PlanetsCli extends ScrollSetCLI {
    // baseFolder = __dirname
    // conceptsFolder = path.join(__dirname, "concepts")
    // parsersFile = "code/measures.parsers"
    // scrollSetName = "cancerdb"
    // compiledConcepts = "./cancerdb.json"
  }
  const planetsCli = new PlanetsCli()
  areEqual(!!planetsCli, true)
}

testParticles.format = async areEqual => {
  // Arrange
  const page = new ScrollFile(``)
  // Act/Assert
  await page.singlePassFuse()
  areEqual(page.scrollProgram.formatted, "", "format works")

  const page2 = new ScrollFile(`# hi`)
  // Act/Assert
  await page2.singlePassFuse()
  areEqual(page2.scrollProgram.formatted, "# hi\n", "format works")
}

testParticles.outputFileNames = async areEqual => {
  // Arrange
  const page = new ScrollFile(``)
  // Act
  await page.singlePassFuse()
  // Assert
  areEqual(page.scrollProgram.outputFileNames.length, 0, "no outputFileNames in a blank file")

  // Arrange
  const page2 = new ScrollFile(`buildHtml foo.html
buildTxt foo.txt
`)
  // Act
  await page2.singlePassFuse()
  // Assert
  areEqual(page2.scrollProgram.outputFileNames[1], "foo.txt")
}

testParticles.initCommand = async areEqual => {
  const tempFolder = path.join(__dirname, "tempFolderForTesting")

  try {
    fs.mkdirSync(tempFolder)
    const cli = new ScrollCli()
    cli.verbose = false

    // Act
    const result = await cli.initCommand(tempFolder)
    areEqual(fs.existsSync(path.join(tempFolder, "header.scroll")), true, "has header")

    const products = await cli.buildFilesInFolder(tempFolder)

    // Assert
    areEqual(Disk.read(products[3]).includes("Built with Scroll"), true, "has message")
    areEqual(products.filter(name => name.endsWith(".html")).length, 2, "should have 2 html pages")
    areEqual(products.length, 7, "should have 7 total generated files")

    const { scrollErrors, parserErrors } = await cli.getErrorsInFolder(tempFolder)
    areEqual(scrollErrors.length, 0)
    areEqual(parserErrors.length, 0)
  } catch (err) {
    console.log(err)
  }
  fs.rmSync(tempFolder, { recursive: true })
}

testParticles.hodgePodge = async areEqual => {
  try {
    // Arrange/act
    const cli = new ScrollCli().silence()
    await cli.buildFilesInFolder(testsFolder)
    const groupPage = Disk.read(path.join(testsFolder, "snippets.html"))
    const autoPage = Disk.read(path.join(testsFolder, "autoTitle.html"))
    const sitemap = Disk.read(path.join(testsFolder, "sitemap.txt"))

    // Assert
    areEqual(groupPage.includes("NUM_SINKS"), false, "var substitution worked")
    areEqual(fs.existsSync(path.join(testsFolder, "snippets.html")), true, "should have snippets page")
    areEqual(autoPage.includes("2024"), true, "should have year 2024")
    areEqual(autoPage.includes("Auto Title"), true, "should have un camel cased title")
    areEqual(sitemap.includes("snippets.html"), true, "should have a sitemap")

    areEqual(fs.readFileSync(path.join(stampFolder, "scripts", "nested", "hello.js"), "utf8"), `console.log("Hello world")`)
  } catch (err) {
    console.log(err)
  }

  // Cleanup:
  fs.readdirSync(testsFolder)
    .filter(file => path.extname(file) === ".html" && !file.includes("htmlInclude"))
    .forEach(file => fs.unlinkSync(path.join(testsFolder, file)))

  fs.rmSync(stampFolder, { recursive: true })
}

const stripImported = str => {
  const particle = new Particle(str)
  particle.getParticles("imported").forEach(particle => particle.destroy())
  return particle.toString()
}

testParticles.inMemory = async equal => {
  // Arrange/Act/Assert
  const cli = new ScrollCli().silence()
  const files = {
    "/hello.scroll": "world",
    "/main.scroll": "import hello.scroll\nimport nested/test.scroll",
    "/nested/test.scroll": "ciao",
    "/nested/deep/relative.scroll": "import ../../hello.scroll\nimport ../test.scroll"
  }
  cli.initFs(files)
  const fused = await cli.sfs.getFusedFilesInFolder("/", "scroll")
  const mainResult = fused.find(file => file.filePath === "/main.scroll")
  equal(stripImported(mainResult.scrollProgram), "world\nciao")
  equal(mainResult.scrollProgram.toString().includes("exists true"), true)

  const relativeResult = await cli.sfs.getFusedFile("/nested/deep/relative.scroll")
  equal(stripImported(relativeResult.scrollProgram), "world\nciao")
}

testParticles.empty = async equal => {
  // Arrange
  const cli = new ScrollCli().silence()
  const files = {
    "/hello.scroll": "",
    "/main.scroll": "import hello.scroll\nhi"
  }
  cli.initFs(files)

  // Act
  const fused = await cli.sfs.getFusedFilesInFolder("/", "scroll")
  const mainResult = await cli.sfs.getFusedFile("/main.scroll")
  // Assert
  equal(stripImported(mainResult.scrollProgram), `\nhi`)
}

testParticles.nonExistant = async equal => {
  // Arrange/Act/Assert
  const cli = new ScrollCli().silence()
  const files = {
    "/main.scroll": "import env.scroll"
  }
  cli.initFs(files)
  const fused = await cli.sfs.getFusedFilesInFolder("/", "scroll")
  const result = await cli.sfs.getFusedFile("/main.scroll")
  equal(stripImported(result.scrollProgram.toString()), "")
  equal(result.scrollProgram.toString().includes("exists false"), true)
}

testParticles.footers = async equal => {
  // Arrange/Act/Assert
  const cli = new ScrollCli().silence()
  const files = {
    "/hello.scroll": `headerAndFooter.scroll
title Hello world
This is my content
`,
    "/headerAndFooter.scroll": "header.scroll\nfooter.scroll\n footer",
    "/header.scroll": "printTitle",
    "/footer.scroll": "The end."
  }
  cli.initFs(files)
  await cli.sfs.getFusedFilesInFolder("/", "scroll")
  const result = await cli.sfs.getFusedFile("/hello.scroll")
  equal(result.scrollProgram.toString().includes("This is my content"), true)
  equal(result.scrollProgram.toString().endsWith("The end."), true, "ends with footer")
}

// todo: this is not working
testParticles.circularImports = async equal => {
  const cli = new ScrollCli().silence()
  const files = {
    "/a.scroll": "b.scroll",
    "/b.scroll": "a.scroll",
    "/c.scroll": "c.scroll",
    "/d.scroll": "e.scroll\nf.scroll",
    "/e.scroll": "f.scroll",
    "/f.scroll": "g.scroll",
    "/g.scroll": ""
  }
  cli.initFs(files)
  const sfs = cli.sfs
  await sfs.getFusedFilesInFolder("/", "scroll")
  const result2 = await sfs.getFusedFile("/c.scroll")
  equal(result2.scrollProgram.toString().includes("Circular import detected"), true, "Should have detected circularImports")
  const result = await sfs.getFusedFile("/a.scroll")
  equal(result.scrollProgram.toString().includes("Circular import detected"), true, "Should have detected circularImports")
  const result3 = await sfs.getFusedFile("/d.scroll")
  equal(result3.scrollProgram.toString().includes("Circular import detected"), false, "No circularImports detected")
}

testParticles.quickImports = async equal => {
  // Arrange/Act/Assert
  const cli = new ScrollCli().silence()
  const files = {
    "/hello.scroll": "world",
    "/main": "hello.scroll\nnested/test.scroll",
    "/nested/test.scroll": "ciao",
    "/nested/a": "test.scroll",
    "/nested/deep/relative": "../../hello.scroll\n../test.scroll"
  }
  cli.initFs(files)
  const sfs = cli.sfs
  equal(sfs.dirname("/"), "/")

  const [aResult, mainResult, relativeResult] = await Promise.all([sfs.getFusedFile("/nested/a"), sfs.getFusedFile("/main"), sfs.getFusedFile("/nested/deep/relative")])

  equal(stripImported(aResult.scrollProgram.toString()), "ciao")
  equal(stripImported(mainResult.scrollProgram.toString()), "world\nciao")
  equal(stripImported(relativeResult.scrollProgram.toString()), "world\nciao")

  // FileAPI
  // Arrange
  const file = new ScrollFile(files["/main"], "/main", sfs)
  equal(file.fusedCode, undefined)
  // Act
  // TODO: make this singlePassFuse
  await file.fuse()
  // Assert
  equal(stripImported(file.fusedCode), "world\nciao")
}

if (module && !module.parent) TestRacer.testSingleFile(__filename, testParticles)

module.exports = { testParticles }
