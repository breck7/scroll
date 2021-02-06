const { DudBlog } = require("./dudBlog")

const testTree = {}

testTree.basics = (areEqual) => {
	const blog = new DudBlog()
	areEqual(!!blog, true)
}

if (module && !module.parent) require("./testRunner").runTree(testTree)

module.exports = { testTree }
