const tap = require("tap")

const runTree = (testTree) =>
	Object.keys(testTree).forEach((key) => {
		testTree[key](tap.equal)
	})

export { runTree }
