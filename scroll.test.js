const tap = require("tap")
const fs = require("fs")
const { jtree } = require("jtree")
const { ScrollFolder, ScrollCli, SCROLL_SETTINGS_FILENAME, SCROLLDOWN_GRAMMAR_FILENAME, compileATags, scrollKeywords } = require("./scroll.js")
const Scrolldown = new jtree.HandGrammarProgram(fs.readFileSync(__dirname + "/" + SCROLLDOWN_GRAMMAR_FILENAME, "utf8")).compileAndReturnRootConstructor()

const testString = "The extensible alternative to Markdown"
const testPort = 5435

// todo: 1) rss import tests 2) grammar errors test 4) scroll errors tests

const runTree = testTree =>
	Object.keys(testTree).forEach(key => {
		testTree[key](tap.equal)
	})

const testTree = {}

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

	tests.forEach(example => {
		areEqual(compileATags(example.input), example.expected)
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
			expected: `<p class="scrollParagraphComponent">Hello <b>brave <a href="home.com"><u>new</a></b> <s>wor</s>ld</u></p>`
		}
	]

	tests.forEach(example => {
		const result = new Scrolldown(example.text).compile()
		areEqual(result, example.expected)
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

testTree.errorStates = async areEqual => {
	const tempFolder = __dirname + "/tempFolderForTesting/"

	try {
		fs.mkdirSync(tempFolder)
		const cli = new ScrollCli()
		cli.verbose = false

		// Act
		const result = await cli.initCommand(tempFolder)
		areEqual(fs.existsSync(tempFolder + SCROLL_SETTINGS_FILENAME), true)

		const folder = new ScrollFolder(tempFolder).silence()
		const singleFile = folder.buildIndexPage()
		areEqual(singleFile.includes(testString), true)

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
	fs.rmdirSync(tempFolder, { recursive: true })
}

testTree.kitchenSink = async areEqual => {
	const tempFolder = __dirname + "/tempFolderForKitchenSinkTesting/"

	try {
		// Arrange
		fs.mkdirSync(tempFolder)
		fs.writeFileSync(
			tempFolder + SCROLL_SETTINGS_FILENAME,
			`${scrollKeywords.header}
 div CustomHeader
${scrollKeywords.footer}
 div CustomFooter`,
			"utf8"
		)
		fs.writeFileSync(tempFolder + "hello.scroll", `${scrollKeywords.title} hello world`, "utf8")

		// Act
		const folder = new ScrollFolder(tempFolder).silence()
		const singleFile = folder.buildIndexPage()

		// Assert
		areEqual(singleFile.includes("CustomHeader"), true)
		areEqual(singleFile.includes("CustomFooter"), true)
	} catch (err) {
		console.log(err)
	}
	fs.rmdirSync(tempFolder, { recursive: true })
}

// FS tests:
// scroll missing settings file
// settings file missing required settings
// bad Scroll files

if (module && !module.parent) runTree(testTree)

module.exports = { testTree }
