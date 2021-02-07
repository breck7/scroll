const tap = require("tap")
const { DudServer, DudCli, DudBlog } = require("./dud")

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

testTree.blog = areEqual => {
	const blog = new DudBlog()
	areEqual(!!blog, true)
}

testTree.fullIntegrationTest = areEqual => {
	const server = new DudServer()
	areEqual(!!server, true)
}

if (module && !module.parent) runTree(testTree)

module.exports = { testTree }
