const tap = require("tap")
const { ScrollServer, ScrollCli, Scroll, Article, MarkdownFile, SCROLL_SETTINGS_FILENAME } = require("./scroll.node.js")
const fs = require("fs")

const pathToExample = __dirname + "/example.com/"
const testPort = 5435

const runTree = testTree =>
	Object.keys(testTree).forEach(key => {
		testTree[key](tap.equal)
	})

const testTree = {}

testTree.server = areEqual => {
	const scrollServer = new ScrollServer(pathToExample)
	scrollServer.verbose = false
	const httpServer = scrollServer.startListening(testPort)

	areEqual(!!httpServer, true)

	httpServer.close()
}

testTree.scroll = areEqual => {
	const scroll = new ScrollServer(pathToExample).scroll
	areEqual(scroll.toSingleHtmlFile().includes("music"), true)
}

testTree.fullIntegrationTest = areEqual => {
	const server = new ScrollServer()
	areEqual(!!server, true)
}

testTree.markdown = areEqual => {
	// Arrange
	const mdFile = `## hello world
This **is a test** [a](/href)`
	// Act
	const scrollFile = new MarkdownFile(mdFile).toScroll()

	// Assert
	areEqual(mdFile, scrollFile)
}

testTree.article = areEqual => {
	const article = new Article(
		`title About me
hello world`
	)

	areEqual(
		article
			.toStumpNode()
			.toString()
			.includes("scrollArticleCell"),
		true
	)
}

testTree.cli = async areEqual => {
	const cli = new ScrollCli()
	cli.verbose = false
	// Act/Assert
	areEqual(cli.helpCommand().includes("help page"), true)

	// Act/Assert
	areEqual(cli.exportCommand(pathToExample).includes("about"), true)

	// Act/Assert
	areEqual(cli.deleteCommand().includes("delete"), true)

	// Act/Assert
	const httpServer = await cli.serveCommand(pathToExample)
	areEqual(!!httpServer, true)
	httpServer.close()

	// Act/Assert
	areEqual(cli.execute(["help"]).includes("help"), true)
}

testTree.errorStates = async areEqual => {
	const tempFolder = __dirname + "/tempFolderForTesting/"

	try {
		fs.mkdirSync(tempFolder)
		const cli = new ScrollCli()
		cli.verbose = false
		// Act/Assert
		areEqual(cli.exportCommand(tempFolder).includes("❌"), true)

		// Act/Assert
		const msg = await cli.serveCommand(tempFolder)
		areEqual(typeof msg, "string")

		// Act
		const result = await cli.createCommand(tempFolder)
		areEqual(fs.existsSync(tempFolder + SCROLL_SETTINGS_FILENAME), true)

		const server = new ScrollServer(tempFolder)
		const singleFile = server.buildSaveAndServeSingleHtmlFile()
		areEqual(singleFile.includes("contains every node"), true)

		const singlePages = server.buildSinglePages()

		areEqual(singlePages.length, 4)

		areEqual(server.errors.flatten().length, 0)
	} catch (err) {
		console.log(err)
	}
	fs.rmdirSync(tempFolder, { recursive: true })
}

// FS tests:
// scroll missing published folder
// scroll missing settings file
// settings file missing required settings
// bad Scroll files

if (module && !module.parent) runTree(testTree)

module.exports = { testTree }
