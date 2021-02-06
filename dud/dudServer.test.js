const { DudServer } = require("./dudServer")

const testTree = {}

testTree.basics = (areEqual) => {
	const server = new DudServer()
	areEqual(!!server, true)
}

if (module && !module.parent) require("./testRunner").runTree(testTree)

module.exports = { testTree }
