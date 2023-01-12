#! /usr/bin/env node

// NPM ecosystem includes
const parseArgs = require("minimist")
const path = require("path")
const fs = require("fs")
const lodash = require("lodash")
const dayjs = require("dayjs")
const open = require("open")

// Tree Notation Includes
const { TreeNode } = require("jtree/products/TreeNode.js")
const { Disk } = require("jtree/products/Disk.node.js")
const { HandGrammarProgram } = require("jtree/products/GrammarLanguage.js")
const grammarNode = require("jtree/products/grammar.nodejs.js")
const stump = require("jtree/products/stump.nodejs.js")
const hakon = require("jtree/products/hakon.nodejs.js")
const packageJson = require("./package.json")

// Helper utils
const read = fullFilePath => fs.readFileSync(fullFilePath, "utf8").replace(/\r/g, "") // Note: This also removes \r. There's never a reason to use \r.
const removeReturnCharsAndRightShift = (str, numSpaces) => str.replace(/\r/g, "").replace(/\n/g, "\n" + " ".repeat(numSpaces))
const unsafeStripHtml = html => html.replace(/<[^>]*>?/gm, "")
// Normalize 3 possible inputs: 1) cwd of the process 2) provided absolute path 3) cwd of process + provided relative path
const resolvePath = (folder = "") => (path.isAbsolute(folder) ? path.normalize(folder) : path.resolve(path.join(process.cwd(), folder)))
const isAbsoluteUrl = url => url.startsWith("https://") || url.startsWith("http://")

const nextAndPrevious = (arr, item) => {
	const current = arr.indexOf(item)
	const nextIndex = current + 1
	const previousIndex = current - 1
	return {
		previous: arr[previousIndex] ?? arr[arr.length - 1],
		next: arr[nextIndex] ?? arr[0]
	}
}

// Do not overwrite to preserve mtimes for cache
const writeIfChanged = (filepath, content) => {
	if (!Disk.exists(filepath) || Disk.read(filepath) !== content) Disk.write(filepath, content)
}

const recursiveReaddirSync = (folder, callback) =>
	fs.readdirSync(folder).forEach(file => {
		try {
			const fullPath = path.join(folder, file)
			const isDir = fs.lstatSync(fullPath).isDirectory()
			if (file.includes("node_modules")) return // Do not recurse into node_modules folders
			if (isDir) recursiveReaddirSync(fullPath, callback)
			else callback(fullPath)
		} catch (err) {
			// Ignore errors
		}
	})

// Constants
const SCROLL_SRC_FOLDER = __dirname
const SCROLL_VERSION = packageJson.version
const SCROLL_FILE_EXTENSION = ".scroll"
const GRAMMAR_EXTENSION = ".grammar"
const standardDateFormat = `YYYY.MM.DD`
const grammarDefinitionRegex = /[a-zA-Z0-9_]+Node/

const readFileCache = {}
const readFileWithCache = absolutePath => {
	if (!readFileCache[absolutePath]) readFileCache[absolutePath] = { absolutePath, content: Disk.read(absolutePath), mtime: fs.statSync(absolutePath) }
	return readFileCache[absolutePath]
}

const expandedImportCache = {}
// A regex to check if a multiline string has a line that starts with "import ".
const importRegex = /^import /gm
const getFullyExpandedFile = absoluteFilePath => {
	if (expandedImportCache[absoluteFilePath]) return expandedImportCache[absoluteFilePath]
	const code = readFileWithCache(absoluteFilePath).content

	if (!code.match(importRegex))
		return {
			code,
			importFilePaths: []
		}

	let importFilePaths = []
	const lines = code.split("\n")
	const replacements = []
	lines.forEach((line, index) => {
		const folder = path.dirname(absoluteFilePath)
		if (line.match(importRegex)) {
			const absoluteImportFilePath = path.join(folder, line.replace("import ", ""))
			const expandedFile = getFullyExpandedFile(absoluteImportFilePath)
			replacements.push([index, expandedFile.code])
			importFilePaths.push(absoluteImportFilePath)
			importFilePaths = importFilePaths.concat(expandedFile.importFilePaths)
		}
	})

	replacements.forEach(replacement => {
		const [lineNumber, text] = replacement
		lines[lineNumber] = text
	})

	expandedImportCache[absoluteFilePath] = {
		code: lines.join("\n"),
		importFilePaths
	}
	return expandedImportCache[absoluteFilePath]
}

const getOneGrammarFromFiles = filePaths => {
	const asOneFile = filePaths
		.map(filePath => {
			const content = readFileWithCache(filePath).content
			if (filePath.endsWith(GRAMMAR_EXTENSION)) return content
			// Strip scroll content
			return new TreeNode(content)
				.filter(node => node.getLine().match(grammarDefinitionRegex))
				.map(node => node.toString())
				.join("\n")
		})
		.join("\n")
		.trim()

	// todo: clean up jtree so we are using supported methods (perhaps add a formatOptions that allows you to tell Grammar not to run prettier on js nodes)
	return new grammarNode(asOneFile)
		._sortNodesByInScopeOrder()
		._sortWithParentNodeTypesUpTop()
		.toString()
}
// Default compiler
const DefaultGrammarFiles = Disk.getFiles(path.join(__dirname, "grammar")).filter(file => file.endsWith(GRAMMAR_EXTENSION))
const compilerCache = {}
const getCompiler = filePaths => {
	const key = filePaths
		.filter(fp => fp)
		.sort()
		.join("\n")
	const hit = compilerCache[key]
	if (hit) return hit
	const grammarCode = getOneGrammarFromFiles(filePaths)
	const compiler = new HandGrammarProgram(grammarCode).compileAndReturnRootConstructor()
	compilerCache[key] = {
		grammarCode,
		compiler
	}
	return compilerCache[key]
}
const DefaultScrollCompiler = getCompiler(DefaultGrammarFiles).compiler

// This is all the CSS
const SCROLL_HAKON_FILENAME = "scroll.hakon"
const SCROLL_CSS = new hakon(read(path.join(SCROLL_SRC_FOLDER, SCROLL_HAKON_FILENAME))).compile()

const CommandFnDecoratorSuffix = "Command"

// Todo: how to keep in sync with grammar?
const scrollKeywords = {
	title: "title",
	description: "description",
	viewSourceUrl: "viewSourceUrl",
	permalink: "permalink",
	image: "image",
	date: "date",
	thoughtKeyword: "*",
	endSnippet: "endSnippet",
	groups: "groups",
	keyboardNav: "keyboardNav",
	replace: "replace",
	replaceDefault: "replaceDefault",
	import: "import",
	importOnly: "importOnly",
	baseUrl: "baseUrl",
	viewSourceBaseUrl: "viewSourceBaseUrl",
	openGraphImage: "openGraphImage",
	git: "git",
	email: "email",
	rssFeedUrl: "rssFeedUrl"
}

const initSite = {
	firstPost: `import header.scroll
${scrollKeywords.title} Hello world
${scrollKeywords.date} ${dayjs().format(standardDateFormat)}

* This is my first blog post using Scroll. This post will appear in the feed and on the index page.
groups index
scrollFooter`,
	header: `importOnly
git https://github.com/breck7/scroll
viewSourceBaseUrl https://github.com/breck7/scroll/blob/main
email feedback@scroll.pub
baseUrl https://scroll.pub/
scrollCssTag
scrollHeader`,
	about: `import header.scroll
title About this site

* This is a static page.
scrollFooter`,
	index: `import header.scroll
title My Personal Blog
description My thoughts about life and the world.
snippets index
scrollFooter`
}

const SVGS = {
	git: `<svg xmlns="http://www.w3.org/2000/svg" width="92pt" height="92pt" viewBox="0 0 92 92"><path d="M90.156 41.965 50.036 1.848a5.913 5.913 0 0 0-8.368 0l-8.332 8.332 10.566 10.566a7.03 7.03 0 0 1 7.23 1.684 7.043 7.043 0 0 1 1.673 7.277l10.183 10.184a7.026 7.026 0 0 1 7.278 1.672 7.04 7.04 0 0 1 0 9.957 7.045 7.045 0 0 1-9.961 0 7.038 7.038 0 0 1-1.532-7.66l-9.5-9.497V59.36a7.04 7.04 0 0 1 1.86 11.29 7.04 7.04 0 0 1-9.957 0 7.04 7.04 0 0 1 0-9.958 7.034 7.034 0 0 1 2.308-1.539V33.926a7.001 7.001 0 0 1-2.308-1.535 7.049 7.049 0 0 1-1.516-7.7L29.242 14.273 1.734 41.777a5.918 5.918 0 0 0 0 8.371L41.855 90.27a5.92 5.92 0 0 0 8.368 0l39.933-39.934a5.925 5.925 0 0 0 0-8.371"/></g></svg>`,
	email: `<svg viewBox="3 5 24 20" width="24" height="20" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 0, -289.0625)"><path style="opacity:1;stroke:none;stroke-width:0.49999997;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" d="M 5 5 C 4.2955948 5 3.6803238 5.3628126 3.3242188 5.9101562 L 14.292969 16.878906 C 14.696939 17.282876 15.303061 17.282876 15.707031 16.878906 L 26.675781 5.9101562 C 26.319676 5.3628126 25.704405 5 25 5 L 5 5 z M 3 8.4140625 L 3 23 C 3 24.108 3.892 25 5 25 L 25 25 C 26.108 25 27 24.108 27 23 L 27 8.4140625 L 17.121094 18.292969 C 15.958108 19.455959 14.041892 19.455959 12.878906 18.292969 L 3 8.4140625 z " transform="translate(0,289.0625)" id="rect4592"/></g></svg>`,
	home: `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.7166 3.79541C12.2835 3.49716 11.7165 3.49716 11.2834 3.79541L4.14336 8.7121C3.81027 8.94146 3.60747 9.31108 3.59247 9.70797C3.54064 11.0799 3.4857 13.4824 3.63658 15.1877C3.7504 16.4742 4.05336 18.1747 4.29944 19.4256C4.41371 20.0066 4.91937 20.4284 5.52037 20.4284H8.84433C8.98594 20.4284 9.10074 20.3111 9.10074 20.1665V15.9754C9.10074 14.9627 9.90433 14.1417 10.8956 14.1417H13.4091C14.4004 14.1417 15.204 14.9627 15.204 15.9754V20.1665C15.204 20.3111 15.3188 20.4284 15.4604 20.4284H18.4796C19.0806 20.4284 19.5863 20.0066 19.7006 19.4256C19.9466 18.1747 20.2496 16.4742 20.3634 15.1877C20.5143 13.4824 20.4594 11.0799 20.4075 9.70797C20.3925 9.31108 20.1897 8.94146 19.8566 8.7121L12.7166 3.79541ZM10.4235 2.49217C11.3764 1.83602 12.6236 1.83602 13.5765 2.49217L20.7165 7.40886C21.4457 7.91098 21.9104 8.73651 21.9448 9.64736C21.9966 11.0178 22.0564 13.5119 21.8956 15.3292C21.7738 16.7067 21.4561 18.4786 21.2089 19.7353C20.9461 21.0711 19.7924 22.0001 18.4796 22.0001H15.4604C14.4691 22.0001 13.6655 21.1791 13.6655 20.1665V15.9754C13.6655 15.8307 13.5507 15.7134 13.4091 15.7134H10.8956C10.754 15.7134 10.6392 15.8307 10.6392 15.9754V20.1665C10.6392 21.1791 9.83561 22.0001 8.84433 22.0001H5.52037C4.20761 22.0001 3.05389 21.0711 2.79113 19.7353C2.54392 18.4786 2.22624 16.7067 2.10437 15.3292C1.94358 13.5119 2.00338 11.0178 2.05515 9.64736C2.08957 8.73652 2.55427 7.91098 3.28346 7.40886L10.4235 2.49217Z"/></svg>`
}

const evalVariables = code => {
	const codeAsTree = new TreeNode(code)
	// Process variables
	const varMap = {}
	codeAsTree
		.filter(node => {
			const keyword = node.getWord(0)
			return keyword === "replace" || keyword === "replaceDefault"
		})
		.forEach(node => {
			varMap[node.getWord(1)] = node.length ? node.childrenToString() : node.getWordsFrom(2).join(" ")
		})

	const keys = Object.keys(varMap)
	if (!keys.length) return code

	let codeAfterVariableSubstitution = code
	// Todo: speed up. build a template?
	Object.keys(varMap).forEach(key => (codeAfterVariableSubstitution = codeAfterVariableSubstitution.replace(new RegExp(key, "g"), varMap[key])))

	return codeAfterVariableSubstitution
}

const _grammarExpandersCache = {}
const doesFileHaveGrammarDefinitions = absoluteFilePath => {
	if (!absoluteFilePath) return false
	if (_grammarExpandersCache[absoluteFilePath] === undefined) _grammarExpandersCache[absoluteFilePath] = !!readFileWithCache(absoluteFilePath).content.match(/^[a-zA-Z0-9_]+Node/gm)

	return _grammarExpandersCache[absoluteFilePath]
}

const _treeCache = {}
const getFileAsTree = absoluteFilePath => {
	if (_treeCache[absoluteFilePath] === undefined) {
		_treeCache[absoluteFilePath] = new TreeNode(read(absoluteFilePath))
	}
	return _treeCache[absoluteFilePath]
}

const makePermalink = filename => filename.replace(SCROLL_FILE_EXTENSION, "") + ".html"

class ScrollFile {
	constructor(originalScrollCode = "", folder = new ScrollFolder(), absoluteFilePath = "", mtime = 0) {
		this.folder = folder
		this.filePath = absoluteFilePath
		this.filename = path.basename(this.filePath)
		this.SCROLL_CSS = SCROLL_CSS // todo: cleanup

		let afterImportPass = originalScrollCode
		let filepathsWithGrammarDefinitions = []
		if (absoluteFilePath) {
			// Do not build a file marked 'importOnly'
			this.shouldBuild = !getFileAsTree(absoluteFilePath).has(scrollKeywords.importOnly)
			const expandedFile = getFullyExpandedFile(absoluteFilePath)
			filepathsWithGrammarDefinitions = expandedFile.importFilePaths.filter(doesFileHaveGrammarDefinitions)
			if (doesFileHaveGrammarDefinitions(absoluteFilePath)) filepathsWithGrammarDefinitions.push(absoluteFilePath)
			afterImportPass = expandedFile.code
		}

		const afterVariablePass = evalVariables(afterImportPass)

		// Compile with STD LIB or custom compiler if there are grammar defs defined
		const compiler = filepathsWithGrammarDefinitions.length === 0 ? DefaultScrollCompiler : getCompiler(DefaultGrammarFiles.concat(filepathsWithGrammarDefinitions)).compiler
		this.scrollScriptProgram = new compiler(afterVariablePass)

		this.scrollFilesWithGrammarNodeDefinitions = filepathsWithGrammarDefinitions
		this.scrollScriptProgram.setFile(this)
		this.timestamp = dayjs(this.scrollScriptProgram.get(scrollKeywords.date) ?? 0).unix()
		this.permalink = this.scrollScriptProgram.get(scrollKeywords.permalink) || makePermalink(this.filename)
	}

	SVGS = SVGS
	SCROLL_VERSION = SCROLL_VERSION
	SCROLL_CSS = SCROLL_CSS
	shouldBuild = true
	filePath = ""

	compileStumpCode(code) {
		return new stump(code).compile()
	}

	get git() {
		return this.get(scrollKeywords.git)
	}

	get email() {
		return this.get(scrollKeywords.email)
	}

	get primaryGroup() {
		return this.folder.getGroup(this.groups[0])
	}

	get hasKeyboardNav() {
		return this.scrollScriptProgram.has(scrollKeywords.keyboardNav)
	}

	get keyboardNavGroup() {
		return this.hasKeyboardNav ? this.primaryGroup.filter(file => file.shouldBuild && file.hasKeyboardNav) : undefined
	}

	get linkToPrevious() {
		const { keyboardNavGroup } = this
		if (!keyboardNavGroup) return undefined
		return nextAndPrevious(keyboardNavGroup, this).previous.permalink
	}

	get linkToNext() {
		const { keyboardNavGroup } = this
		if (!keyboardNavGroup) return undefined
		return nextAndPrevious(keyboardNavGroup, this).next.permalink
	}

	save() {
		writeIfChanged(`${this.filePath}`, this.scrollScriptProgram.toString())
	}

	// todo: add an openGraph node type to define this stuff manually
	get openGraphImage() {
		const openGraphImage = this.get(scrollKeywords.openGraphImage)
		if (openGraphImage !== undefined) return openGraphImage

		const node = this.scrollScriptProgram.getNode(scrollKeywords.image)
		if (!node) return ""

		const link = node.getContent()
		return isAbsoluteUrl(link) ? link : this.baseUrl + "/" + link
	}

	// todo: add an openGraph node type to define this stuff manually
	// Use the first thought for the description
	// todo: add a tree method version of get that gets you the first node. (actulaly make get return array?)
	// would speed up a lot.
	get description() {
		const program = this.scrollScriptProgram
		const description = program.get(scrollKeywords.description)
		if (description) return description

		for (let node of program.getTopDownArrayIterator()) {
			const word = node.getWord(0)
			if (word === scrollKeywords.thoughtKeyword)
				return unsafeStripHtml(node.compile())
					.replace(/\n/g, " ")
					.substr(0, 300)
		}
		return ""
	}

	get groups() {
		return (this.scrollScriptProgram.get(scrollKeywords.groups) || "").split(" ")
	}

	get title() {
		return this.scrollScriptProgram.get(scrollKeywords.title) ?? ""
	}

	get(keyword) {
		return this.scrollScriptProgram.get(keyword)
	}

	get viewSourceUrl() {
		const viewSourceUrl = this.get(scrollKeywords.viewSourceUrl)
		const viewSourceBaseUrl = this.get(scrollKeywords.viewSourceBaseUrl)
		return viewSourceUrl || (viewSourceBaseUrl ? viewSourceBaseUrl.replace(/\/$/, "") + "/" + path.basename(this.filePath) : "")
	}

	_compiled = ""
	get compiled() {
		if (!this._compiled) this._compiled = this.scrollScriptProgram.compile()
		return this._compiled
	}

	_compiledSnippet = ""
	get compiledSnippet() {
		if (!this._compiledSnippet) this._compiledSnippet = this.scrollScriptProgram.compileSnippet() + this.viewSourceHtml
		return this._compiledSnippet
	}

	get viewSourceHtml() {
		return this.compileStumpCode(`p
 class scrollFileViewSourceUrlComponent
 a View source
  href ${this.viewSourceUrl}`)
	}

	get html() {
		return this.compiled.trim()
	}

	get htmlCodeForSnippetsPage() {
		const snippetBreakNode = this.scrollScriptProgram.getNode(scrollKeywords.endSnippet)
		if (!snippetBreakNode) return this.compiledSnippet
		const indexOfBreak = snippetBreakNode.getIndex()

		const { scrollScriptProgram, permalink } = this
		const joinChar = scrollScriptProgram._getChildJoinCharacter()
		const html =
			scrollScriptProgram
				.map((child, index) => (index >= indexOfBreak ? "" : child.compileSnippet ? child.compileSnippet() : child.compile()))
				.filter(i => i)
				.join(joinChar) + `<a class="scrollContinueReadingLink" href="${permalink}">Continue reading...</a>`

		return html + this.viewSourceHtml
	}

	// todo: rename publishedUrl? Or something to indicate that this is only for stuff on the web (not localhost)
	// BaseUrl must be provided for RSS Feeds and OpenGraph tags to work
	get baseUrl() {
		return this.scrollScriptProgram.get(scrollKeywords.baseUrl) ?? ""
	}

	toRss() {
		const { title, permalink, baseUrl } = this
		return ` <item>
  <title>${title}</title>
  <link>${baseUrl + permalink}</link>
  <pubDate>${dayjs(this.timestamp * 1000).format("ddd, DD MMM YYYY HH:mm:ss ZZ")}</pubDate>
 </item>`
	}
}

class ScrollFolder {
	constructor(folder = __dirname) {
		this.folder = path.normalize(folder)
	}

	getGroup(groupName) {
		return this.files.filter(file => file.shouldBuild && file.groups.includes(groupName))
	}

	get grammarErrors() {
		this._initFiles() // Init all compilers
		return Object.values(compilerCache)
			.map(compiler => new grammarNode(compiler.grammarCode).getAllErrors().map(err => err.toObject()))
			.flat()
	}

	get fullScrollFilePaths() {
		return Disk.getFiles(this.folder).filter(file => file.endsWith(SCROLL_FILE_EXTENSION))
	}

	_initFiles() {
		if (this._files) return
		const all = this.fullScrollFilePaths.map(fullFilePath => {
			const { content, mtime } = readFileWithCache(fullFilePath)
			return new ScrollFile(content, this, fullFilePath, mtime)
		})
		this._files = lodash.sortBy(all, file => file.timestamp).reverse()
	}

	_files
	get files() {
		if (this._files) return this._files
		this._initFiles()
		return this._files
	}

	get errors() {
		return this.files
			.map(file =>
				file.scrollScriptProgram.getAllErrors().map(err => {
					return { filename: file.filename, ...err.toObject() }
				})
			)
			.flat()
	}

	silence() {
		this.verbose = false
		return this
	}

	verbose = true
	folder = ""

	logIndent = 0
	log(message) {
		const indent = "    ".repeat(this.logIndent)
		if (this.verbose) console.log(indent + message)
		return message
	}

	buildFiles() {
		return this._buildAndWriteFiles()
	}

	// This is an advanced method designed to work fast most of the time, but not check every case.
	// It does not yet check mtimes of any imports not in this folder.
	// It also assumes metaTags to check for scroll version.
	get buildNeeded() {
		const scrollFiles = this.fullScrollFilePaths.map(filepath => readFileWithCache(filepath))
		const lastMTime = lodash.max(scrollFiles.map(file => file.mtime))
		let haveWeCheckedScrollVersion = false

		let reason = ""
		scrollFiles.some(file => {
			const { content, mtime, absolutePath } = file
			if (content.includes(scrollKeywords.importOnly)) return false
			let outputFilePath = makePermalink(absolutePath)
			if (!fs.existsSync(outputFilePath)) {
				if (content.includes(scrollKeywords.permalink)) outputFilePath = path.join(this.folder, new TreeNode(content).get(scrollKeywords.permalink)) // note this won't resolve substitutions
				if (!fs.existsSync(outputFilePath)) return (reason = `Need to build ${absolutePath} to create ${outputFilePath}`)
			}
			const lastBuiltTime = fs.statSync(outputFilePath).mtime
			if (lastMTime > lastBuiltTime) return (reason = `Need to build to update ${outputFilePath}`)
			if (!haveWeCheckedScrollVersion) {
				haveWeCheckedScrollVersion = true
				// Assume metaTags. Returns true if the current version of scroll !== the version used to build this html file.
				// We only check one for better perf
				if (!readFileWithCache(outputFilePath).content.includes(`Scroll v${SCROLL_VERSION}`)) return (reason = `Need to build to update ${outputFilePath} to Scroll Version ${SCROLL_VERSION}`)
			}
			return false
		})
		return reason
	}

	_buildAndWriteFiles() {
		const start = Date.now()
		const { files, folder } = this
		const filesToBuild = files.filter(file => file.shouldBuild)
		this.log(`Building ${filesToBuild.length} files from ${files.length} ${SCROLL_FILE_EXTENSION} files found in '${folder}'\n`)
		this.logIndent++
		const pages = filesToBuild.map(file => {
			const { permalink, html } = file
			this.write(permalink, html, `Wrote ${file.filename} to ${permalink}`)
			return { permalink, html }
		})
		const seconds = (Date.now() - start) / 1000
		this.logIndent--
		this.log(``)
		this.log(`⌛️ Compiled ${pages.length} files to html in ${seconds} seconds. ${lodash.round(pages.length / seconds)} pages per second\n`)

		return pages
	}

	write(filename, content, message) {
		const result = writeIfChanged(path.join(this.folder, filename), content)
		this.log(`💾 ` + message)
		return result
	}

	buildAll() {
		this.log(`\n👷 building folder '${this.folder}'\n`)
		this.logIndent++
		this.buildFiles()
		this.logIndent--
	}
}

class ScrollCli {
	executeUsersInstructionsFromShell(args = [], userIsPipingInput = !process.stdin.isTTY) {
		const command = args[0] // Note: we don't take any parameters on purpose. Simpler UX.
		const commandName = `${command}${CommandFnDecoratorSuffix}`
		if (this[commandName]) return userIsPipingInput ? this._runCommandOnPipedStdIn(commandName) : this[commandName](process.cwd())
		else if (command) this.log(`No command '${command}'. Running help command.`)
		else this.log(`No command provided. Running help command.`)
		return this.helpCommand()
	}

	_runCommandOnPipedStdIn(commandName) {
		let pipedData = ""
		process.stdin.on("readable", function() {
			pipedData += this.read() // todo: what's the lambda way to do this?
		})
		process.stdin.on("end", () => {
			const folders = pipedData
				.trim()
				.split("\n")
				.map(line => line.trim())
				.filter(line => fs.existsSync(line))

			folders.forEach(line => this[commandName](line))

			if (folders.length === 0)
				// Hacky to make sure this at least does something in all environments.
				// process.stdin.isTTY is not quite accurate for pipe detection
				this[commandName](process.cwd())
		})
	}

	verbose = true
	log(message) {
		if (this.verbose) console.log(message)
		return message
	}

	get _allCommands() {
		return Object.getOwnPropertyNames(Object.getPrototypeOf(this))
			.filter(word => word.endsWith(CommandFnDecoratorSuffix))
			.sort()
	}

	async initCommand(cwd) {
		const folder = new ScrollFolder()
		this.log(`Initializing scroll in "${cwd}"`)

		Object.keys(initSite).forEach(filename => {
			const filePath = path.join(cwd, filename + SCROLL_FILE_EXTENSION)
			if (!fs.existsSync(filePath)) writeIfChanged(filePath, initSite[filename])
		})

		return this.log(`\n👍 Initialized new scroll in '${cwd}'. Build your new site with: scroll build`)
	}

	deleteCommand() {
		return this.log(`\n💡 To delete a Scroll just delete the folder\n`)
	}

	testCommand(cwd) {
		const folder = new ScrollFolder(resolvePath(cwd))
		const { grammarErrors } = folder
		const grammarMessage = grammarErrors.length ? new TreeNode(grammarErrors).toFormattedTable(200) + "\n" : ""
		if (grammarMessage) this.log(grammarMessage)
		const scrollErrors = folder.errors
		const message = scrollErrors.length ? new TreeNode(scrollErrors).toFormattedTable(60) : "0 errors"
		return this.log(message)
	}

	async buildCommand(cwd) {
		const folder = new ScrollFolder(resolvePath(cwd))
		folder.verbose = this.verbose
		folder.buildAll()
		return folder
	}

	async watchCommand(cwd) {
		const folderOrErrorMessage = await this.buildCommand(cwd)
		if (typeof folderOrErrorMessage === "string") return folderOrErrorMessage
		const { folder } = folderOrErrorMessage

		this.log(`\n🔭 Watching for changes in 📁 ${folder}`)

		this._watcher = fs.watch(folder, (event, filename) => {
			const fullFilePath = path.join(folder, filename)
			if (!fullFilePath.endsWith(SCROLL_FILE_EXTENSION)) return
			this.log(`\n✅ "${fullFilePath}" changed.`)

			if (!Disk.exists(fullFilePath)) {
				// file deleted
			} else if (false) {
				// new file
			} else {
				// file updates
			}
			const newFolder = new ScrollFolder(folder)
			newFolder.verbose = folder.verbose
			newFolder.buildAll()
		})

		if (this.verbose) await open(`file://${folder}/index.html`)
		return this
	}

	_watcher = undefined

	stopWatchingForFileChanges() {
		this._watcher.close()
		this._watcher = undefined
	}

	listCommand(cwd) {
		return this.findScrollsInDirRecursive(cwd)
	}

	findScrollsInDirRecursive(dir) {
		const folders = {}
		recursiveReaddirSync(dir, filename => {
			if (!filename.endsWith(SCROLL_FILE_EXTENSION)) return

			const folder = path.dirname(filename)
			if (!folders[folder]) {
				folders[folder] = {
					folder,
					scrollFileCount: 0
				}
				this.log(folder)
			}
			folders[folder].scrollFileCount++
		})

		return folders
	}

	helpCommand() {
		this.log(`\n📜📜📜 WELCOME TO SCROLL (v${SCROLL_VERSION}) 📜📜📜`)
		return this.log(`\nThis is the Scroll help page.\n\nCommands you can run from your Scroll's folder:\n\n${this._allCommands.map(comm => `🖌️ ` + comm.replace(CommandFnDecoratorSuffix, "")).join("\n")}\n​​`)
	}
}

if (module && !module.parent) new ScrollCli().executeUsersInstructionsFromShell(parseArgs(process.argv.slice(2))._)

module.exports = { ScrollFile, ScrollFolder, ScrollCli, scrollKeywords, DefaultScrollCompiler, getFullyExpandedFile }
