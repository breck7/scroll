// To use:
// npm install rss-parser got cheerio
const Parser = require("rss-parser")
const got = require("got")
const cheerio = require("cheerio")
const { SCROLL_FILE_EXTENSION, scrollKeywords } = require("../scroll.js")

// Todo: deprecate/remove/split out into sep project?
class RssImporter {
	constructor(path) {
		this.path = path
	}
	path = ""

	savePost(item, content, destinationFolder) {
		const { title, pubDate, isoDate } = item
		const date = pubDate || isoDate ? `${scrollKeywords.date} ${pubDate || isoDate}` : ""
		const scrollFile = `${scrollKeywords.title} ${title}
${date}
${scrollKeywords.paragraph}
 ${removeReturnCharsAndRightShift(content, 1)}
`
		write(path.join(destinationFolder, Utils.stringToPermalink(title) + SCROLL_FILE_EXTENSION), scrollFile)
	}

	async downloadFilesTo(destinationFolder) {
		const parser = new Parser()
		console.log(`⏳ downloading '${this.path}'`)
		const feed = await parser.parseURL(this.path)

		await Promise.all(
			feed.items.map(async item => {
				if (item.content) return this.savePost(item, item.content, destinationFolder)

				try {
					console.log(`⏳ downloading '${item.link}'`)
					const response = await got(item.link)
					const html = response.body
					const dom = cheerio.load(html)
					this.savePost(item, dom.text(), destinationFolder)
				} catch (err) {
					console.log(`❌ downloading '${item.link}'`)
				}
			})
		)
	}
}

// rss, twitter, hn, reddit, pinterest, instagram, tiktok, youtube?
const importSite = async (importFrom, destination) => {
	// A loose check for now to catch things like "format=rss"
	if (importFrom.includes("rss") || importFrom.includes("feed")) {
		const importer = new RssImporter(importFrom)
		return await importer.downloadFilesTo(destination)
	}

	return `❌ Scroll wasn't sure how to import '${importFrom}'.\n💡 You can open an issue here: https://github.com/breck7/scroll/issues`
}

module.exports = { importSite }
