#! /usr/bin/env node

const tap = require("tap")
const fs = require("fs")
const path = require("path")
const { jtree } = require("jtree")
const { ScrollFolder, ScrollCli, SCROLL_SETTINGS_FILENAME, scrollKeywords, ScrollPage, DefaultScrollScriptCompiler } = require("../scroll.js")
const shell = require("child_process").execSync

const testString = "An extensible alternative to Markdown"
const testPort = 5435

// todo: 1) rss import tests 2) grammar errors test 4) scroll errors tests

const runTree = testTree =>
	Object.keys(testTree).forEach(key => {
		testTree[key](tap.equal)
	})

const testTree = {}

// LinkSuffixLang. [anyWord🔗absoluteUrl] or [anyWord🔗./relativeUrl]
// anyWord text cannot contain 🔗
// url should not contain the protocol. It will compile always to https. Use <a> if you need something else.
// If url ends in a period, that will be dropped.
// Url cannot contain a comma.
testTree.compileATags = areEqual => {
	const tests = [
		{ input: `this🔗example.com`, expected: `<a href="https://example.com">this</a>` },
		{ input: `this🔗example.com this🔗example.com`, expected: `<a href="https://example.com">this</a> <a href="https://example.com">this</a>` },
		{ input: `this🔗https://example.com`, expected: `<a href="https://example.com">this</a>` },
		{ input: `this🔗http://example.com`, expected: `<a href="http://example.com">this</a>` },
		{ input: `this🔗example.com/`, expected: `<a href="https://example.com/">this</a>` },
		{ input: `this🔗example.com/index.`, expected: `<a href="https://example.com/index">this</a>.` },
		{ input: `this🔗./foo.html, bar`, expected: `<a href="foo.html">this</a>, bar` },
		{ input: `View the releaseNotes🔗./releaseNotes.html.`, expected: `View the <a href="releaseNotes.html">releaseNotes</a>.` }
	]

	const doc = new DefaultScrollScriptCompiler()
	tests.forEach(example => {
		areEqual(doc.compileATags(example.input), example.expected)
	})
}

testTree.compileAftertext = areEqual => {
	const tests = [
		{
			text: `aftertext
 Hello brave new world
 link home.com new
 bold brave new
 underline new world
 strikethrough wor`,
			expected: `<p class="scrollParagraphComponent">Hello <b>brave <u><a href="home.com">new</a></b> <s>wor</s>ld</u></p>`
		}
	]

	tests.forEach(example => {
		const result = new DefaultScrollScriptCompiler(example.text).compile()
		areEqual(result, example.expected)
	})
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
		const result = new DefaultScrollScriptCompiler(example.text).compile()
		areEqual(result.includes(example.contains), true)
	})
}

testTree.scroll = areEqual => {
	areEqual(new ScrollFolder().files[0].toHtml().includes(testString), true)
}

testTree.fullIntegrationTest = areEqual => {
	const folder = new ScrollFolder()
	areEqual(!!folder, true)
}

testTree.import = async areEqual => {
	const cli = new ScrollCli()
	cli.verbose = false
	const result = await cli.importCommand()
	areEqual(result.includes("You need to add a"), true)
}

testTree.check = async areEqual => {
	const cli = new ScrollCli()
	cli.verbose = false
	const result = await cli.checkCommand()
	areEqual(result.includes("0 errors"), true)
}

testTree.file = areEqual => {
	const file = new ScrollFolder().files[1]
	const content = file.htmlCode

	areEqual(file.permalink, "releaseNotes.html")
	areEqual(content.includes("Scroll the language is now called ScrollScript"), true)
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
	areEqual(cli.execute(["help"]).includes("help"), true)

	// Act
	const results = cli.findScrollsInDirRecursive(__dirname)
	// Assert
	areEqual(results.includes("containing .scroll files"), true, "search was run")
}

testTree.standalonePage = areEqual => {
	// Arrange
	const page = new ScrollPage(`title A standalone page
paragraph
 Blue sky`)
	// Act/Assert
	const { html } = page
	areEqual(html.includes("Blue sky"), true)
}

testTree.errorStates = async areEqual => {
	const tempFolder = path.join(__dirname, "tempFolderForTesting")

	try {
		fs.mkdirSync(tempFolder)
		const cli = new ScrollCli()
		cli.verbose = false

		// Act
		const result = await cli.initCommand(tempFolder)
		areEqual(fs.existsSync(path.join(tempFolder, SCROLL_SETTINGS_FILENAME)), true)

		const folder = new ScrollFolder(tempFolder).silence()
		const singleFile = folder.buildFiles()

		// Assert
		areEqual(singleFile.includes(testString), true)

		// Act
		const singlePages = folder.buildFiles()

		// Assert
		areEqual(singlePages.length, 1)

		// Assert
		const singlePageTitleSnippet = `Scroll</title>`
		areEqual(singlePages[0].html.includes(singlePageTitleSnippet), true)

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
		const groupPage = Disk.read(path.join(kitchenSinkFolder, "index.hmtl"))

		// Assert
		areEqual(groupPage.includes("CustomHeader"), true, "should have custom header")
		areEqual(groupPage.includes("CustomFooter"), true, "should have custom footer")
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
