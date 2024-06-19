#! /usr/bin/env node

const tap = require("tap")
const fs = require("fs")
const path = require("path")
const { ScrollCli, ScrollFile, DefaultScrollParser, ScrollFileSystem } = require("../scroll.js")
const { Disk } = require("scrollsdk/products/Disk.node.js")
const { TestRacer } = require("scrollsdk/products/TestRacer.js")
const parsersParser = require("scrollsdk/products/parsers.nodejs.js")
const shell = require("child_process").execSync

const testTree = {}

testTree.compileAftertext = areEqual => {
  const tests = [
    {
      text: `* Hello brave new world
 link home.com new
 bold brave new
 underline new world
 strikethrough wor`,
      expected: `<p class="scrollParagraph">Hello <b>brave <u><a href="home.com">new</a></b> <s>wor</s>ld</u></p>`
    }
  ]

  tests.forEach(example => {
    const result = new DefaultScrollParser(example.text).compile()
    areEqual(result, example.expected)
  })
}

testTree.paragraphParser = areEqual => {
  // Arrange
  const program = new DefaultScrollParser(`* foo`)

  // Act
  program.compile()
  const result = program.compile()

  areEqual(result, `<p class="scrollParagraph">foo</p>`)
}

testTree.linkOnly = areEqual => {
  // Arrange
  const program = new DefaultScrollParser(`* https://notation.scroll.pub`)

  // Act
  program.compile()
  const result = program.compile()

  areEqual(result, `<p class="scrollParagraph"><a href="https://notation.scroll.pub" target="_blank">https://notation.scroll.pub</a></p>`)
}

testTree.endSnippet = areEqual => {
  // Arrange
  const program = new DefaultScrollParser(`Hi\nendSnippet`)

  // Act/Assert
  areEqual(program.compile().includes("endSnippet"), false, "should not print endSnippet")
}

testTree.tableWithLinks = areEqual => {
  const tests = [
    {
      text: `commaTable
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

testTree.test = async areEqual => {
  const cli = new ScrollCli()
  cli.verbose = false
  const result = await cli.testCommand()
  areEqual(result.includes("0 errors"), true)
}

testTree.testAllScrollsInThisRepo = async areEqual => {
  const cli = new ScrollCli()
  cli.verbose = false
  const result = await cli.listCommand(path.join(__dirname, ".."))
  Object.keys(result).forEach(async dir => {
    const result = await cli.testCommand(dir)
    areEqual(result.includes("0 errors"), true, `No errors in '${dir}'`)
  })
}

testTree.inMemoryFileSystem = areEqual => {
  // You could get all in folders with lodash.unique(Object.keys(this.files).map(filename => path.dirname(filename)))

  // Arrange
  const files = {
    "/header.scroll": "import settings.scroll",
    "/settings.scroll": "* This should be imported",
    "/pages/about.scroll": `import ../header.scroll\ntitle About us
pParser
 extends paragraphParser
 crux p
p A custom parser`
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

testTree.file = areEqual => {
  const rootFolder = path.join(__dirname, "..")
  const fileSystem = new ScrollFileSystem()
  const files = fileSystem.getScrollFilesInFolder(rootFolder)
  const releaseNotesFile = files.find(file => file.permalink === "releaseNotes.html")

  areEqual(releaseNotesFile.permalink, "releaseNotes.html")
  areEqual(releaseNotesFile.html.includes("Scroll the language is now called"), true)
  areEqual(releaseNotesFile.description, "A list of what has changed in Scroll releases.", "Meta description auto-generated if not specified.")
  areEqual(files[4].permalink, "roadmap.html")
}

testTree.ensureNoErrorsInParser = areEqual => {
  const parserErrors = new parsersParser(new DefaultScrollParser().definition.asString).getAllErrors().map(err => err.toObject())
  if (parserErrors.length) console.log(parserErrors)
  areEqual(parserErrors.length, 0, "no errors in scroll standard library parsers")
}

testTree.cli = async areEqual => {
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

testTree.standalonePage = areEqual => {
  // Arrange
  const page = new ScrollFile(`title A standalone page
printTitle
* Blue sky`)
  // Act/Assert
  const { html, asText } = page
  areEqual(html.includes("Blue sky"), true)
  areEqual(asText.includes("A standalone page"), true)
}

testTree.aBlankPage = areEqual => {
  // Arrange
  const page = new ScrollFile(``)
  // Act/Assert
  areEqual(page.html, ``)

  // Arrange
  const testHidden = new ScrollFile(`permalink blank.html
# Hello world
 hidden`)
  // Act/Assert
  areEqual(testHidden.html, `<!DOCTYPE html>\n<html lang="en">\n<body>\n\n</body>\n</html>`)
}

testTree.rss = areEqual => {
  // Arrange
  const page = new ScrollFile(`printFeed index
permalink feed.rss`)
  // Act/Assert
  const { html } = page
  areEqual(html.startsWith("<?xml "), true)
}

testTree.baseUrl = areEqual => {
  // Arrange
  const page = new ScrollFile(`baseUrl http://test.com/
metaTags
image blog/screenshot.png`)
  // Act/Assert
  const { html } = page
  areEqual(html.includes("http://test.com/blog/screenshot.png"), true)
}

testTree.csv = areEqual => {
  // Arrange
  const page = new ScrollFile(`printCsv index
permalink posts.csv`)
  // Act/Assert
  const { html } = page
  areEqual(html.startsWith("date,title,permalink,"), true)
}

testTree.initCommand = async areEqual => {
  const tempFolder = path.join(__dirname, "tempFolderForTesting")

  try {
    fs.mkdirSync(tempFolder)
    const cli = new ScrollCli()
    const fileSystem = new ScrollFileSystem()
    cli.verbose = false

    // Act
    const result = await cli.initCommand(tempFolder)
    areEqual(fs.existsSync(path.join(tempFolder, "header.scroll")), true)

    const pages = cli.buildFilesInFolder(fileSystem, tempFolder)

    // Assert
    areEqual(pages[0].html.includes("Built with Scroll"), true)
    areEqual(pages.length, 3, "should have 3 pages")

    const { scrollErrors, parserErrors } = cli.getErrorsInFolder(tempFolder)
    areEqual(scrollErrors.length, 0)
    areEqual(parserErrors.length, 0)
  } catch (err) {
    console.log(err)
  }
  fs.rmSync(tempFolder, { recursive: true })
}

testTree.kitchenSink = async areEqual => {
  const kitchenSinkFolder = path.join(__dirname, "kitchenSink")
  try {
    // Arrange/act
    const cli = new ScrollCli().silence()
    const fileSystem = new ScrollFileSystem()
    cli.buildFilesInFolder(fileSystem, kitchenSinkFolder)
    const groupPage = Disk.read(path.join(kitchenSinkFolder, "all.html"))

    // Assert
    areEqual(groupPage.includes("NUM_SINKS"), false, "var substitution worked")
    areEqual(fs.existsSync(path.join(kitchenSinkFolder, "full.html")), true, "should have full page")
  } catch (err) {
    console.log(err)
  }

  // Cleanup:
  fs.readdirSync(kitchenSinkFolder)
    .filter(file => path.extname(file) === ".html")
    .forEach(file => fs.unlinkSync(path.join(kitchenSinkFolder, file)))
}

if (module && !module.parent) TestRacer.testSingleFile(__filename, testTree)

module.exports = { testTree }
