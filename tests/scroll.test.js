#! /usr/bin/env node

const tap = require("tap")
const fs = require("fs")
const path = require("path")
const { ScrollCli, ScrollFile, DefaultScrollParser, ScrollFileSystem } = require("../scroll.js")
const { Disk } = require("scrollsdk/products/Disk.node.js")
const { TestRacer } = require("scrollsdk/products/TestRacer.js")
const parsersParser = require("scrollsdk/products/parsers.nodejs.js")
const shell = require("child_process").execSync

const testParticles = {}

const testsFolder = path.join(__dirname)
const stampFolder = path.join(testsFolder, "testOutput")

// cleanup in case it was built earlier:
if (Disk.exists(stampFolder)) fs.rmSync(stampFolder, { recursive: true })

testParticles.compileAftertext = areEqual => {
  const tests = [
    {
      text: `* Hello brave new world
 link home.com new
 bold brave new
 underline new world
 strike wor`,
      expected: `<p class="scrollParagraph">Hello <b>brave <u><a href="home.com">new</a></b> <s>wor</s>ld</u></p>`
    }
  ]

  tests.forEach(example => {
    const result = new DefaultScrollParser(example.text).compile()
    areEqual(result, example.expected)
  })
}

testParticles.paragraphParser = areEqual => {
  // Arrange
  const program = new DefaultScrollParser(`* foo`)

  // Act
  program.compile()
  const result = program.compile()

  areEqual(result, `<p class="scrollParagraph">foo</p>`)
}

testParticles.linkOnly = areEqual => {
  // Arrange
  const program = new DefaultScrollParser(`* https://notation.scroll.pub`)

  // Act
  program.compile()
  const result = program.compile()

  areEqual(result, `<p class="scrollParagraph"><a href="https://notation.scroll.pub" target="_blank">https://notation.scroll.pub</a></p>`)
}

testParticles.endSnippet = areEqual => {
  // Arrange
  const program = new DefaultScrollParser(`Hi\nendSnippet`)

  // Act/Assert
  areEqual(program.compile().includes("endSnippet"), false, "should not print endSnippet")
}

testParticles.tableWithLinks = areEqual => {
  const tests = [
    {
      text: `table
 delimiter ,
 printTable
 data
  name,nameLink
  Wikipedia,https://wikipedia.org`,
      contains: `<a href="https://wikipedia.org">`
    }
  ]

  tests.forEach(example => {
    const result = new DefaultScrollParser(example.text).compile()
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
  Object.keys(result).forEach(async dir => {
    const result = await cli.testCommand(dir)
    areEqual(result.includes("0 errors"), true, `No errors in '${dir}'`)
  })
}

testParticles.inMemoryFileSystem = areEqual => {
  // You could get all in folders with lodash.unique(Object.keys(this.files).map(filename => path.dirname(filename)))

  // Arrange
  const files = {
    "/header.scroll": "import settings.scroll",
    "/settings.scroll": "* This should be imported",
    "/pages/about.scroll": `import ../header.scroll\ntitle About us
pParser
 extends paragraphParser
 crux p
p A custom parser
buildHtml`
  }
  // Act
  const cli = new ScrollCli().silence()
  const fileSystem = new ScrollFileSystem(files)
  cli.buildFilesInFolder(fileSystem, "/")
  cli.buildFilesInFolder(fileSystem, "/pages/")

  // Assert
  areEqual(files["/pages/about.html"].includes("This should be imported"), true, "In memory file system worked")
  areEqual(files["/pages/about.html"].includes(`<html lang="en">`), true, "HTML tag and lang attribute set to ensure hyphenation will work.")
}

testParticles.file = areEqual => {
  const rootFolder = path.join(__dirname, "..")
  const fileSystem = new ScrollFileSystem()
  const files = fileSystem.getScrollFilesInFolder(rootFolder)
  const releaseNotesFile = files.find(file => file.permalink === "releaseNotes.html")

  areEqual(releaseNotesFile.permalink, "releaseNotes.html")
  areEqual(releaseNotesFile.asHtml.includes("Scroll the language is now called"), true)
  areEqual(releaseNotesFile.description, "A list of what has changed in Scroll releases.", "Meta description auto-generated if not specified.")
  areEqual(files[4].permalink.endsWith(".html"), true)
}

testParticles.ensureNoErrorsInParser = areEqual => {
  const parserErrors = new parsersParser(new DefaultScrollParser().definition.asString).getAllErrors().map(err => err.toObject())
  if (parserErrors.length) console.log(parserErrors)
  areEqual(parserErrors.length, 0, "no errors in scroll standard library parsers")
}

testParticles.cli = async areEqual => {
  const cli = new ScrollCli()
  cli.verbose = false
  // Act/Assert
  areEqual(cli.helpCommand().includes("help page"), true)

  // Act/Assert
  areEqual(cli.deleteCommand().includes("delete"), true)

  // Act/Assert
  const result = await cli.buildCommand()
  areEqual(!!result, true)

  // Act/Assert
  areEqual(cli.executeUsersInstructionsFromShell(["help"], false).includes("help"), true)

  // Act
  const results = cli.findScrollsInDirRecursive(__dirname)
  // Assert
  areEqual(JSON.stringify(results).includes("scrollFileCount"), true, "list works")
}

testParticles.standalonePage = areEqual => {
  // Arrange
  const page = new ScrollFile(`title A standalone page
printTitle
* Blue sky`)
  // Act/Assert
  const { asHtml, asTxt } = page
  areEqual(asHtml.includes("Blue sky"), true)
  areEqual(asTxt.includes("A standalone page"), true)
}

testParticles.aBlankPage = areEqual => {
  // Arrange
  const page = new ScrollFile(``)
  // Act/Assert
  areEqual(page.asHtml, ``)

  // Arrange
  const testHidden = new ScrollFile(`permalink blank.html
# Hello world
 hidden`)
  // Act/Assert
  areEqual(testHidden.asHtml, `<!DOCTYPE html>\n<html lang="en">\n<body>\n\n</body>\n</html>`)
}

testParticles.rss = areEqual => {
  // Arrange
  const page = new ScrollFile(`printFeed index
buildRss`)
  // Act/Assert
  const { asHtml } = page
  areEqual(asHtml.startsWith("<?xml "), true)
}

testParticles.baseUrl = areEqual => {
  // Arrange
  const page = new ScrollFile(`baseUrl http://test.com/
metaTags
image blog/screenshot.png`)
  // Act/Assert
  const { asHtml } = page
  areEqual(asHtml.includes("http://test.com/blog/screenshot.png"), true)
}

testParticles.csv = areEqual => {
  // Arrange
  const page = new ScrollFile(`printCsv index
permalink posts.csv`)
  // Act/Assert
  const { asHtml } = page
  areEqual(asHtml.startsWith("date,year,title,permalink,"), true)
}

testParticles.initCommand = async areEqual => {
  const tempFolder = path.join(__dirname, "tempFolderForTesting")

  try {
    fs.mkdirSync(tempFolder)
    const cli = new ScrollCli()
    const fileSystem = new ScrollFileSystem()
    cli.verbose = false

    // Act
    const result = await cli.initCommand(tempFolder)
    areEqual(fs.existsSync(path.join(tempFolder, "header.scroll")), true, "has header")

    const products = cli.buildFilesInFolder(fileSystem, tempFolder)

    // Assert
    areEqual(Object.values(products)[1].includes("Built with Scroll"), true, "has message")
    areEqual(Object.keys(products).filter(name => name.endsWith(".html")).length, 2, "should have 2 html pages")
    areEqual(Object.values(products).length, 5, "should have 5 total generated files")

    const { scrollErrors, parserErrors } = cli.getErrorsInFolder(tempFolder)
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
    const fileSystem = new ScrollFileSystem()
    cli.buildFilesInFolder(fileSystem, testsFolder)
    const groupPage = Disk.read(path.join(testsFolder, "all.html"))
    const autoPage = Disk.read(path.join(testsFolder, "autoTitle.html"))
    const sitemap = Disk.read(path.join(testsFolder, "sitemap.txt"))

    // Assert
    areEqual(groupPage.includes("NUM_SINKS"), false, "var substitution worked")
    areEqual(fs.existsSync(path.join(testsFolder, "full.html")), true, "should have full page")
    areEqual(autoPage.includes("2024"), true, "should have year 2024")
    areEqual(autoPage.includes("Auto Title"), true, "should have un camel cased title")
    areEqual(sitemap.includes("full.html"), true, "should have a sitemap")

    areEqual(fs.readFileSync(path.join(stampFolder, "scripts", "nested", "hello.js"), "utf8"), `console.log("Hello world")`)
  } catch (err) {
    console.log(err)
  }

  // Cleanup:
  fs.readdirSync(testsFolder)
    .filter(file => path.extname(file) === ".html")
    .forEach(file => fs.unlinkSync(path.join(testsFolder, file)))

  fs.rmSync(stampFolder, { recursive: true })
}

if (module && !module.parent) TestRacer.testSingleFile(__filename, testParticles)

module.exports = { testParticles }
