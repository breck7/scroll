#! /usr/bin/env node

const tap = require("tap")
const fs = require("fs")
const path = require("path")
const { jtree } = require("jtree")
const { ScrollFolder, ScrollCli, SCROLL_SETTINGS_FILENAME, SCROLLDOWN_GRAMMAR_FILENAME, scrollKeywords, ScrollPage } = require("./scroll.js")
const Scrolldown = new jtree.HandGrammarProgram(fs.readFileSync(path.join(__dirname, SCROLLDOWN_GRAMMAR_FILENAME), "utf8")).compileAndReturnRootConstructor()

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

	const doc = new Scrolldown()
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
		const result = new Scrolldown(example.text).compile()
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
		const result = new Scrolldown(example.text).compile()
		areEqual(result.includes(example.contains), true)
	})
}

testTree.scroll = areEqual => {
	areEqual(new ScrollFolder().indexPage.toHtml().includes(testString), true)
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

testTree.article = areEqual => {
	const article = new ScrollFolder().allArticles[0]
	const content = article.htmlCode

	areEqual(article.permalink, "releaseNotes")
	areEqual(content.includes("Scroll the language is now called Scrolldown"), true)
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
		const singleFile = folder.buildIndexPage()

		// Assert
		areEqual(singleFile.includes(testString), true)
		areEqual(folder.shouldBuildSnippetsPage, false)

		// Act
		const singlePages = folder.buildSinglePages()

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
	const tempFolder = path.join(__dirname, "tempFolderForKitchenSinkTesting")

	try {
		// Arrange
		fs.mkdirSync(tempFolder)
		fs.writeFileSync(
			path.join(tempFolder, SCROLL_SETTINGS_FILENAME),
			`${scrollKeywords.header}
 div CustomHeader
${scrollKeywords.footer}
 div CustomFooter`,
			"utf8"
		)
		fs.writeFileSync(
			path.join(tempFolder, "hello.scroll"),
			`${scrollKeywords.title} hello world
endSnippet`,
			"utf8"
		)

		// Act
		const folder = new ScrollFolder(tempFolder).silence()
		const singleFile = folder.buildIndexPage()
		const customSnippetsPageName = "foobar.html"
		const snippetsPage = folder.buildSnippetsPage(customSnippetsPageName)

		// Assert
		areEqual(singleFile.includes("CustomHeader"), true)
		areEqual(singleFile.includes("CustomFooter"), true)
		areEqual(folder.shouldBuildSnippetsPage, true)
		areEqual(fs.existsSync(path.join(tempFolder, customSnippetsPageName)), true)
	} catch (err) {
		console.log(err)
	}
	fs.rmSync(tempFolder, { recursive: true })
}

// FS tests:
// scroll missing settings file
// settings file missing required settings
// bad Scroll files

if (module && !module.parent) runTree(testTree)

module.exports = { testTree }
