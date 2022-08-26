#! /usr/bin/env node
const { ScrollFolder } = require("../scroll.js")
const { importSite } = require("./RssImporter.js")
const fs = require("fs")
const path = require("path")

const cases = `https://juliagalef.com/feed/
http://www.aaronsw.com/2002/feeds/pgessays.rss
https://fs.blog/feed/
https://sive.rs/podcast.rss
https://lrb.co.uk/feeds/rss
https://believermag.com/feed/
https://waitbutwhy.com/feed
https://xkcd.com/rss.xml
https://torrentfreak.com/feed/
https://blogmaverick.com/feed/
https://vitalik.ca/feed.xml
https://worksinprogress.co/feed/
https://meyerweb.com/eric/thoughts/feed/`.split("\n")

const rootFolder = path.join(__dirname, "importExamples")

try {
	fs.mkdirSync(rootFolder)
} catch (err) {
	console.error(err)
}
cases.forEach(async url => {
	const { hostname } = new URL(url)
	const folder = path.join(rootFolder, hostname)
	try {
		fs.mkdirSync(folder)
		await importSite(url, folder)
		const scroll = new ScrollFolder(folder)
		scroll.buildFiles()
	} catch (err) {
		console.error(err)
	}
})
