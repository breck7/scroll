const tap = require("tap")
const { DudServer, DudCli, Dud } = require("./dud")

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

if (module && !module.parent) runTree(testTree)

module.exports = { testTree }
