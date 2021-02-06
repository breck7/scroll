const { DudServer, DudCli } = require("./dudCli")

const testTree = {}

testTree.basics = (areEqual) => {
	const server = new DudServer()
	areEqual(!!server, true)
}

testTree.toStamp = (areEqual) => {
	const server = new DudServer()
	const stamp = server.toStamp()
	areEqual(!!stamp.includes("awesome"), true)
}

testTree.fullIntegrationTest = (areEqual) => {
	const server = new DudServer()
	areEqual(!!server, true)
}

if (module && !module.parent) require("./testRunner").runTree(testTree)

module.exports = { testTree }
