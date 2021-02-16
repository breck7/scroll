const tap = require("tap")
const { DudServer, DudCli, Dud } = require("../dud/dud.js")

const runTree = testTree =>
	Object.keys(testTree).forEach(key => {
		testTree[key](tap.equal)
	})

const testTree = {}

testTree.basics = areEqual => {
	const server = new DudServer()
	areEqual(!!server, true)
}

testTree.toStamp = areEqual => {
	const server = new DudServer()
	const stamp = server.toStamp()
	areEqual(!!stamp.includes("awesome"), true)
}

testTree.dud = areEqual => {
	const dud = new Dud()
	areEqual(!!dud, true)
}

testTree.fullIntegrationTest = areEqual => {
	const server = new DudServer()
	areEqual(!!server, true)
}

// FS tests:
// dud missing published folder
// dud missing settings file
// settings file missing required settings
// bad dumbdown files

if (module && !module.parent) runTree(testTree)

module.exports = { testTree }
