const tap = require("tap")
const { ScrollServer, ScrollCli, Scroll } = require("../scroll.node.js")

const runTree = testTree =>
	Object.keys(testTree).forEach(key => {
		testTree[key](tap.equal)
	})

const testTree = {}

testTree.basics = areEqual => {
	const server = new ScrollServer()
	areEqual(!!server, true)
}

testTree.toStamp = areEqual => {
	const server = new ScrollServer()
	const stamp = server.toStamp()
	areEqual(!!stamp.includes("awesome"), true)
}

testTree.scroll = areEqual => {
	const scroll = new Scroll()
	areEqual(!!scroll, true)
}

testTree.fullIntegrationTest = areEqual => {
	const server = new ScrollServer()
	areEqual(!!server, true)
}

// FS tests:
// scroll missing published folder
// scroll missing settings file
// settings file missing required settings
// bad dumbdown files

if (module && !module.parent) runTree(testTree)

module.exports = { testTree }
