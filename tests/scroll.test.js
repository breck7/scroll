#! /usr/bin/env node

const tap = require("tap")
const fs = require("fs")
const path = require("path")
const { ScrollFolder, ScrollCli, scrollKeywords, ScrollFile, DefaultScrollCompiler } = require("../scroll.js")
const { Disk } = require("jtree/products/Disk.node.js")
const grammarNode = require("jtree/products/grammar.nodejs.js")
const shell = require("child_process").execSync

// todo: 1) rss import tests 2) grammar errors test 4) scroll errors tests

const runTree = testTree =>
	Object.keys(testTree).forEach(key => {
		testTree[key](tap.equal)
	})

const testTree = {}

testTree.compileAftertext = areEqual => {
	const tests = [
		{
			text: `* Hello brave new world
 link home.com new
 bold brave new
 underline new world
 strikethrough wor`,
			expected: `<p class="scrollParagraphComponent">Hello <b>brave <u><a href="home.com">new</a></b> <s>wor</s>ld</u></p>`
		}
	]

	tests.forEach(example => {
		const result = new DefaultScrollCompiler(example.text).compile()
		areEqual(result, example.expected)
	})
}

testTree.thoughtNode = areEqual => {
	// Arrange
	const program = new DefaultScrollCompiler(`* foo`)

	// Act
	program.compile()
	const result = program.compile()

	areEqual(result, `<p class="scrollParagraphComponent">foo</p>`)
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
		const result = new DefaultScrollCompiler(example.text).compile()
		areEqual(result.includes(example.contains), true)
	})
}

testTree.fullIntegrationTest = areEqual => {
	const folder = new ScrollFolder()
	areEqual(!!folder, true)
}

testTree.test = async areEqual => {
	const cli = new ScrollCli()
	cli.verbose = false
	const result = await cli.testCommand()
	areEqual(result.includes("0 errors"), true)
}

testTree.file = areEqual => {
	const file = new ScrollFolder().files[0]
	const content = file.html

	areEqual(file.permalink, "releaseNotes.html")
	areEqual(content.includes("Scroll the language is now called"), true)
}

testTree.ensureNoErrorsInGrammar = areEqual => {
	const grammarErrors = new grammarNode(new DefaultScrollCompiler().getDefinition().toString()).getAllErrors().map(err => err.toObject())
	if (grammarErrors.length) console.log(grammarErrors)
	areEqual(grammarErrors.length, 0, "no errors in scroll standard library grammar")
}

testTree.watchCommand = async areEqual => {
	// Arrange
	const cli = new ScrollCli()
	cli.verbose = false

	// Act
	const folder = await cli.watchCommand()

	// Assert
	areEqual(!!cli._watcher, true)

	cli.stopWatchingForFileChanges()
}

testTree.cli = async areEqual => {
	const cli = new ScrollCli()
	cli.verbose = false
	// Act/Assert
	areEqual(cli.helpCommand().includes("help page"), true)

	// Act/Assert
	areEqual(cli.deleteCommand().includes("delete"), true)

	// Act/Assert
	const folder = await cli.buildCommand()
	areEqual(!!folder, true)

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
* Blue sky`)
	// Act/Assert
	const { html } = page
	areEqual(html.includes("Blue sky"), true)
}

testTree.initCommand = async areEqual => {
	const tempFolder = path.join(__dirname, "tempFolderForTesting")

	try {
		fs.mkdirSync(tempFolder)
		const cli = new ScrollCli()
		cli.verbose = false

		// Act
		const result = await cli.initCommand(tempFolder)
		areEqual(fs.existsSync(path.join(tempFolder, "header.scroll")), true)

		const folder = new ScrollFolder(tempFolder).silence()
		const pages = folder.buildFiles()

		// Assert
		areEqual(pages[0].html.includes("Built with Scroll"), true)
		areEqual(pages.length, 3, "should have 3 pagee")
		areEqual(folder.errors.flat().length, 0)
	} catch (err) {
		console.log(err)
	}
	fs.rmSync(tempFolder, { recursive: true })
}

testTree.kitchenSink = async areEqual => {
	const kitchenSinkFolder = path.join(__dirname, "kitchenSink")
	try {
		// Arrange/act
		const folder = new ScrollFolder(kitchenSinkFolder).silence()
		folder.buildAll()
		const groupPage = Disk.read(path.join(kitchenSinkFolder, "all.html"))

		// Assert
		areEqual(groupPage.includes("NUM_SINKS"), false, "var substitution worked")
		areEqual(fs.existsSync(path.join(kitchenSinkFolder, "full.html")), true, "should have full page")
	} catch (err) {
		console.log(err)
	}

	shell(`rm -f ${kitchenSinkFolder}/*.html`)
}

// FS tests:
// scroll missing settings file
// settings file missing required settings
// bad Scroll files

if (module && !module.parent) runTree(testTree)

module.exports = { testTree }
