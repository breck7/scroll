#! /usr/bin/env node

// NPM ecosystem includes
const parseArgs = require("minimist")
const path = require("path")
const fs = require("fs")
const lodash = require("lodash")
const dayjs = require("dayjs")
const open = require("open")

// Tree Notation Includes
const { jtree } = require("jtree")
const { TreeNode } = jtree
const { Disk } = require("jtree/products/Disk.node.js")
const grammarNode = require("jtree/products/grammar.nodejs.js")
const stump = require("jtree/products/stump.nodejs.js")
const hakon = require("jtree/products/hakon.nodejs.js")
const packageJson = require("./package.json")

// Helper utils
const read = fullFilePath => fs.readFileSync(fullFilePath, "utf8").replace(/\r/g, "") // Note: This also removes \r. There's never a reason to use \r.
const write = (fullFilePath, content) => fs.writeFileSync(fullFilePath, content, "utf8")
const removeReturnCharsAndRightShift = (str, numSpaces) => str.replace(/\r/g, "").replace(/\n/g, "\n" + " ".repeat(numSpaces))
const unsafeStripHtml = html => html.replace(/<[^>]*>?/gm, "")
// Normalize 3 possible inputs: 1) cwd of the process 2) provided absolute path 3) cwd of process + provided relative path
const resolvePath = (folder = "") => (path.isAbsolute(folder) ? path.normalize(folder) : path.resolve(path.join(process.cwd(), folder)))
const isAbsoluteUrl = url => url.startsWith("https://") || url.startsWith("http://")

const nextAndPrevious = (arr, item) => {
	const len = arr.length
	const current = arr.indexOf(item)
	return {
		previous: arr[(current + len - 1) % len],
		next: arr[(current + 1) % len]
	}
}

const recursiveReaddirSync = (folder, callback) =>
	fs.readdirSync(folder).forEach(file => {
		try {
			const fullPath = path.join(folder, file)
			const isDir = fs.lstatSync(fullPath).isDirectory()
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
const readFileWithCache = path => {
	if (!readFileCache[path]) readFileCache[path] = Disk.read(path)
	return readFileCache[path]
}

const expandedImportCache = {}
// A regex to check if a multiline string has a line that starts with "import ".
const importRegex = /^import /gm
const getFullyExpandedFile = absoluteFilePath => {
	if (expandedImportCache[absoluteFilePath]) return expandedImportCache[absoluteFilePath]
	const code = readFileWithCache(absoluteFilePath)

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
			const content = readFileWithCache(filePath)
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
	const compiler = new jtree.HandGrammarProgram(grammarCode).compileAndReturnRootConstructor()
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
const DEFAULT_COLUMN_WIDTH = 35
const COLUMN_GAP = 20

const CommandFnDecoratorSuffix = "Command"
const scrollBoilerplateCompiledMessage = `<!doctype html>
<!--

 The HTML below was generated by 📜 Scroll, a public domain
 programming language and static site publishing tool.
 
 https://scroll.pub
 
 Generally you don't want to edit it by hand.

 Scroll v${SCROLL_VERSION}

-->`

const cssClasses = {
	scrollSnippetsComponent: "scrollSnippetsComponent",
	scrollGroupPageFileContainerComponent: "scrollGroupPageFileContainerComponent",
	scrollFileViewSourceUrlComponent: "scrollFileViewSourceUrlComponent",
	scrollFilePageComponent: "scrollFilePageComponent",
	scrollPrevPageLink: "scrollPrevPageLink",
	scrollNextPageLink: "scrollNextPageLink"
}

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
	replace: "replace",
	replaceDefault: "replaceDefault",
	import: "import",
	importOnly: "importOnly",
	baseUrl: "baseUrl",
	viewSourceBaseUrl: "viewSourceBaseUrl",
	openGraphImage: "openGraphImage",
	maxColumns: "maxColumns",
	columnWidth: "columnWidth",
	twitter: "twitter",
	github: "github",
	email: "email",
	rssFeedUrl: "rssFeedUrl",
	scrollCss: "scrollCss"
}

const initSite = {
	firstPost: `import header.scroll
${scrollKeywords.title} Hello world
${scrollKeywords.date} ${dayjs().format(standardDateFormat)}

* This is my first blog post using Scroll. This post will appear in the feed and on the index page.
groups index
scrollFooter`,
	header: `importOnly
title My Personal Blog
description My thoughts about life and the world.
github https://github.com/breck7/scroll
viewSourceBaseUrl https://github.com/breck7/scroll/blob/main
twitter https://twitter.com/breckyunits
email feedback@scroll.pub
baseUrl https://scroll.pub/
scrollHeader`,
	about: `import header.scroll
title About this site

* This is a static page.
scrollFooter`,
	index: `import header.scroll
scrollSnippets index
scrollFooter`
}

const SVGS = {
	github: `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
	twitter: `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>`,
	email: `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>`,
	home: `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.7166 3.79541C12.2835 3.49716 11.7165 3.49716 11.2834 3.79541L4.14336 8.7121C3.81027 8.94146 3.60747 9.31108 3.59247 9.70797C3.54064 11.0799 3.4857 13.4824 3.63658 15.1877C3.7504 16.4742 4.05336 18.1747 4.29944 19.4256C4.41371 20.0066 4.91937 20.4284 5.52037 20.4284H8.84433C8.98594 20.4284 9.10074 20.3111 9.10074 20.1665V15.9754C9.10074 14.9627 9.90433 14.1417 10.8956 14.1417H13.4091C14.4004 14.1417 15.204 14.9627 15.204 15.9754V20.1665C15.204 20.3111 15.3188 20.4284 15.4604 20.4284H18.4796C19.0806 20.4284 19.5863 20.0066 19.7006 19.4256C19.9466 18.1747 20.2496 16.4742 20.3634 15.1877C20.5143 13.4824 20.4594 11.0799 20.4075 9.70797C20.3925 9.31108 20.1897 8.94146 19.8566 8.7121L12.7166 3.79541ZM10.4235 2.49217C11.3764 1.83602 12.6236 1.83602 13.5765 2.49217L20.7165 7.40886C21.4457 7.91098 21.9104 8.73651 21.9448 9.64736C21.9966 11.0178 22.0564 13.5119 21.8956 15.3292C21.7738 16.7067 21.4561 18.4786 21.2089 19.7353C20.9461 21.0711 19.7924 22.0001 18.4796 22.0001H15.4604C14.4691 22.0001 13.6655 21.1791 13.6655 20.1665V15.9754C13.6655 15.8307 13.5507 15.7134 13.4091 15.7134H10.8956C10.754 15.7134 10.6392 15.8307 10.6392 15.9754V20.1665C10.6392 21.1791 9.83561 22.0001 8.84433 22.0001H5.52037C4.20761 22.0001 3.05389 21.0711 2.79113 19.7353C2.54392 18.4786 2.22624 16.7067 2.10437 15.3292C1.94358 13.5119 2.00338 11.0178 2.05515 9.64736C2.08957 8.73652 2.55427 7.91098 3.28346 7.40886L10.4235 2.49217Z"/></svg>`,
	reddit: `<svg role="img" width="32px" height="32px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M 18.65625 4 C 16.558594 4 15 5.707031 15 7.65625 L 15 11.03125 C 12.242188 11.175781 9.742188 11.90625 7.71875 13.0625 C 6.945313 12.316406 5.914063 12 4.90625 12 C 3.816406 12 2.707031 12.355469 1.9375 13.21875 L 1.9375 13.25 L 1.90625 13.28125 C 1.167969 14.203125 0.867188 15.433594 1.0625 16.65625 C 1.242188 17.777344 1.898438 18.917969 3.03125 19.65625 C 3.023438 19.769531 3 19.882813 3 20 C 3 22.605469 4.574219 24.886719 6.9375 26.46875 C 9.300781 28.050781 12.488281 29 16 29 C 19.511719 29 22.699219 28.050781 25.0625 26.46875 C 27.425781 24.886719 29 22.605469 29 20 C 29 19.882813 28.976563 19.769531 28.96875 19.65625 C 30.101563 18.917969 30.757813 17.777344 30.9375 16.65625 C 31.132813 15.433594 30.832031 14.203125 30.09375 13.28125 L 30.0625 13.25 C 29.292969 12.386719 28.183594 12 27.09375 12 C 26.085938 12 25.054688 12.316406 24.28125 13.0625 C 22.257813 11.90625 19.757813 11.175781 17 11.03125 L 17 7.65625 C 17 6.675781 17.558594 6 18.65625 6 C 19.175781 6 19.820313 6.246094 20.8125 6.59375 C 21.65625 6.890625 22.75 7.21875 24.15625 7.3125 C 24.496094 8.289063 25.414063 9 26.5 9 C 27.875 9 29 7.875 29 6.5 C 29 5.125 27.875 4 26.5 4 C 25.554688 4 24.738281 4.535156 24.3125 5.3125 C 23.113281 5.242188 22.246094 4.992188 21.46875 4.71875 C 20.566406 4.402344 19.734375 4 18.65625 4 Z M 16 13 C 19.152344 13 21.964844 13.867188 23.9375 15.1875 C 25.910156 16.507813 27 18.203125 27 20 C 27 21.796875 25.910156 23.492188 23.9375 24.8125 C 21.964844 26.132813 19.152344 27 16 27 C 12.847656 27 10.035156 26.132813 8.0625 24.8125 C 6.089844 23.492188 5 21.796875 5 20 C 5 18.203125 6.089844 16.507813 8.0625 15.1875 C 10.035156 13.867188 12.847656 13 16 13 Z M 4.90625 14 C 5.285156 14 5.660156 14.09375 5.96875 14.25 C 4.882813 15.160156 4.039063 16.242188 3.53125 17.4375 C 3.277344 17.117188 3.125 16.734375 3.0625 16.34375 C 2.953125 15.671875 3.148438 14.976563 3.46875 14.5625 C 3.472656 14.554688 3.464844 14.539063 3.46875 14.53125 C 3.773438 14.210938 4.3125 14 4.90625 14 Z M 27.09375 14 C 27.6875 14 28.226563 14.210938 28.53125 14.53125 C 28.535156 14.535156 28.527344 14.558594 28.53125 14.5625 C 28.851563 14.976563 29.046875 15.671875 28.9375 16.34375 C 28.875 16.734375 28.722656 17.117188 28.46875 17.4375 C 27.960938 16.242188 27.117188 15.160156 26.03125 14.25 C 26.339844 14.09375 26.714844 14 27.09375 14 Z M 11 16 C 9.894531 16 9 16.894531 9 18 C 9 19.105469 9.894531 20 11 20 C 12.105469 20 13 19.105469 13 18 C 13 16.894531 12.105469 16 11 16 Z M 21 16 C 19.894531 16 19 16.894531 19 18 C 19 19.105469 19.894531 20 21 20 C 22.105469 20 23 19.105469 23 18 C 23 16.894531 22.105469 16 21 16 Z M 21.25 21.53125 C 20.101563 22.597656 18.171875 23.28125 16 23.28125 C 13.828125 23.28125 11.898438 22.589844 10.75 21.65625 C 11.390625 23.390625 13.445313 25 16 25 C 18.554688 25 20.609375 23.398438 21.25 21.53125 Z"/></svg>`,
	wikipedia: `<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="98.05px" height="98.05px" viewBox="0 0 98.05 98.05" style="enable-background:new 0 0 98.05 98.05;" xml:space="preserve"><path d="M98.023,17.465l-19.584-0.056c-0.004,0.711-0.006,1.563-0.017,2.121c1.664,0.039,5.922,0.822,7.257,4.327L66.92,67.155 c-0.919-2.149-9.643-21.528-10.639-24.02l9.072-18.818c1.873-2.863,5.455-4.709,8.918-4.843l-0.01-1.968L55.42,17.489 c-0.045,0.499,0.001,1.548-0.068,2.069c5.315,0.144,7.215,1.334,5.941,4.508c-2.102,4.776-6.51,13.824-7.372,15.475 c-2.696-5.635-4.41-9.972-7.345-16.064c-1.266-2.823,1.529-3.922,4.485-4.004v-1.981l-21.82-0.067 c0.016,0.93-0.021,1.451-0.021,2.131c3.041,0.046,6.988,0.371,8.562,3.019c2.087,4.063,9.044,20.194,11.149,24.514 c-2.685,5.153-9.207,17.341-11.544,21.913c-3.348-7.43-15.732-36.689-19.232-44.241c-1.304-3.218,3.732-5.077,6.646-5.213 l0.019-2.148L0,17.398c0.005,0.646,0.027,1.71,0.029,2.187c4.025-0.037,9.908,6.573,11.588,10.683 c7.244,16.811,14.719,33.524,21.928,50.349c0.002,0.029,2.256,0.059,2.281,0.008c4.717-9.653,10.229-19.797,15.206-29.56 L63.588,80.64c0.005,0.004,2.082,0.016,2.093,0.007c7.962-18.196,19.892-46.118,23.794-54.933c1.588-3.767,4.245-6.064,8.543-6.194 l0.032-1.956L98.023,17.465z"/></svg>`
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
	if (_grammarExpandersCache[absoluteFilePath] === undefined) _grammarExpandersCache[absoluteFilePath] = !!readFileWithCache(absoluteFilePath).match(/^[a-zA-Z0-9_]+Node/gm)

	return _grammarExpandersCache[absoluteFilePath]
}

const _treeCache = {}
const getFileAsTree = absoluteFilePath => {
	if (_treeCache[absoluteFilePath] === undefined) {
		_treeCache[absoluteFilePath] = new TreeNode(read(absoluteFilePath))
	}
	return _treeCache[absoluteFilePath]
}

class ScrollFile {
	constructor(originalScrollCode = "", folder = new ScrollFolder(), absoluteFilePath = "") {
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
		this.permalink = this.scrollScriptProgram.get(scrollKeywords.permalink) || this.filename.replace(SCROLL_FILE_EXTENSION, "") + ".html"
	}

	SVGS = SVGS
	SCROLL_VERSION = SCROLL_VERSION
	cssClasses = cssClasses
	shouldBuild = true
	filePath = ""

	compileStumpCode(code) {
		return new stump(code).compile()
	}

	get github() {
		return this.get(scrollKeywords.github)
	}

	get email() {
		return this.get(scrollKeywords.email)
	}

	get twitter() {
		return this.get(scrollKeywords.twitter)
	}

	get previousLink() {
		return " "
	}

	get nextLink() {
		return " "
	}

	get columnWidth() {
		return this.get(scrollKeywords.columnWidth) ?? DEFAULT_COLUMN_WIDTH
	}

	get maxColumns() {
		// If undefined will be autocomputed
		return this.get(scrollKeywords.maxColumns)
	}

	// Todo: scroll.css link thing fix.
	get styleCode() {
		// Default is to inline CSS. Otherwise we can split it into a sep file.
		const cssFile = this.get(scrollKeywords.scrollCss)

		if (cssFile === "") return ""

		if (cssFile)
			return `link
   rel stylesheet
   type text/css
   href ${cssFile}`

		return `styleTag
   bern
    ${removeReturnCharsAndRightShift(SCROLL_CSS, 4)}`
	}

	get rssTag() {
		const rssFeedUrl = this.get(scrollKeywords.rssFeedUrl)
		if (!rssFeedUrl) return ""
		return `link
 rel alternate
 type application/rss+xml
 title ${this.title}
 href ${rssFeedUrl}`
	}

	get previousLink() {
		return ` a <
  class ${cssClasses.scrollPrevPageLink}
  href ${this.linkToPrevious}`
	}

	get nextLink() {
		return ` a >
  class ${cssClasses.scrollNextPageLink}
  href ${this.linkToNext}`
	}

	get estimatedLines() {
		return lodash.sum(this.scrollScriptProgram.map(node => (node.getLine() === "" ? 0 : node.getTopDownArray().length)))
	}

	get cssColumnWorkaround() {
		let { maxColumns, columnWidth } = this
		if (!maxColumns) {
			const { estimatedLines } = this
			if (estimatedLines > 10) return ""
			maxColumns = estimatedLines > 5 ? 2 : 1
		}
		const maxTotalWidth = maxColumns * columnWidth + (maxColumns - 1) * COLUMN_GAP
		return `column-width:${columnWidth}ch;column-count:${maxColumns};max-width:${maxTotalWidth}ch;`
	}

	get primaryGroup() {
		return this.folder.getGroup(this.groups[0])
	}

	get keyboardNavGroup() {
		return this.primaryGroup.filter(file => file.shouldBuild)
	}

	get linkToPrevious() {
		return nextAndPrevious(this.keyboardNavGroup, this).previous.permalink
	}

	get linkToNext() {
		return nextAndPrevious(this.keyboardNavGroup, this).next.permalink
	}

	save() {
		write(`${this.filePath}`, this.scrollScriptProgram.toString())
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

	get stumpCode() {
		const { title, description, openGraphImage, rssTag } = this
		return `html
 lang en-US
 head
  meta
   charset utf-8
  titleTag ${title}
  meta
   name viewport
   content width=device-width,initial-scale=1
  meta
   name description
   content ${description}
  meta
   name generator
   content Scroll v${SCROLL_VERSION}
  meta
   property og:title
   content ${title}
  meta
   property og:description
   content ${description}
  meta
   property og:image
   content ${openGraphImage}
  ${removeReturnCharsAndRightShift(rssTag, 2)}
  meta
   name twitter:card
   content summary_large_image
  ${this.styleCode}
 body
  bern
   ${removeReturnCharsAndRightShift(this.htmlCodeForFullPage, 3)}`
	}

	get html() {
		return scrollBoilerplateCompiledMessage + "\n" + this.compileStumpCode(this.stumpCode)
	}

	get htmlCodeForFullPage() {
		return this.compiled
	}

	get htmlCodeForSnippetsPage() {
		const snippetBreakNode = this.scrollScriptProgram.getNode(scrollKeywords.endSnippet)
		if (!snippetBreakNode) return this.htmlCodeForFullPage
		const indexOfBreak = snippetBreakNode.getIndex()

		const { scrollScriptProgram, permalink } = this
		const joinChar = scrollScriptProgram._getChildJoinCharacter()
		const html =
			scrollScriptProgram
				.map((child, index) => (index >= indexOfBreak ? "" : child.compile()))
				.filter(i => i)
				.join(joinChar) + `<a class="scrollContinueReadingLink" href="${permalink}">Continue reading...</a>`

		return html
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
 </item>`
	}
}

class ScrollFolder {
	constructor(folder = __dirname) {
		this.folder = path.normalize(folder)
	}

	getGroup(groupName) {
		return this.files.filter(file => file.groups.includes(groupName))
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
		const all = this.fullScrollFilePaths.map(fullFilePath => new ScrollFile(readFileWithCache(fullFilePath), this, fullFilePath))
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
		const result = write(path.join(this.folder, filename), content)
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
			if (!fs.existsSync(filePath)) write(filePath, initSite[filename])
		})

		return this.log(`\n👍 Initialized new scroll in '${cwd}'. Build your new site with: scroll build`)
	}

	deleteCommand() {
		return this.log(`\n💡 To delete a Scroll just delete the folder\n`)
	}

	testCommand(cwd) {
		const folder = new ScrollFolder(resolvePath(cwd))
		const { grammarErrors } = folder
		const grammarMessage = grammarErrors.length ? new jtree.TreeNode(grammarErrors).toFormattedTable(200) + "\n" : ""
		if (grammarMessage) this.log(grammarMessage)
		const scrollErrors = folder.errors
		const message = scrollErrors.length ? new jtree.TreeNode(scrollErrors).toFormattedTable(60) : "0 errors"
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
			if (filename.includes("node_modules")) return

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

module.exports = { ScrollFile, ScrollFolder, ScrollCli, scrollKeywords, DefaultScrollCompiler, SCROLL_CSS, getFullyExpandedFile, SVGS }
