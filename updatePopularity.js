#! /usr/bin/env node

/*

I need a node.js script. Using path and fs libraries only.

I have a list of CSV filepaths. Each one contains rows like:
parserId,uses
blankLineParser,864
versionParser,445

I want to merge all of these, and sum them so if 2 rows had a versionParser we would have 1 row with usage sum.

Then once I've done that, I want to add a "popularity" column, which contains the decimal percentage of uses/AllUses.

Then I want to iterate through all the files ending in ".parser" in the parsers/ folder, and find lines starting with parserId such as ^blankLineParser, and then below that line add a line starting with a single space " popularity [number]". Then save those to disk.


*/

const fs = require("fs")
const path = require("path")

// Function to read and parse CSV files
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf-8")
  const rows = content.split("\n")
  rows.shift()
  const data = {}
  for (let row of rows) {
    const [parserId, uses] = row.split(",")
    if (parserId && uses) {
      data[parserId] = (data[parserId] || 0) + parseInt(uses)
    }
  }
  return data
}

// Function to merge data from multiple CSV files
function mergeCSVData(filePaths) {
  let mergedData = {}
  for (let filePath of filePaths) {
    const data = parseCSV(filePath)
    for (let parserId in data) {
      mergedData[parserId] = (mergedData[parserId] || 0) + data[parserId]
    }
  }
  return mergedData
}

// Function to calculate popularity
function calculatePopularity(data) {
  const totalUses = Object.values(data).reduce((sum, uses) => sum + uses, 0)
  const popularityData = {}
  for (let parserId in data) {
    popularityData[parserId] = data[parserId] / totalUses
  }
  return popularityData
}

// Function to update parser files
function updateParserFiles(popularityData, parsersDir) {
  const files = fs.readdirSync(parsersDir)
  for (let file of files) {
    if (file.endsWith(".parsers")) {
      const filePath = path.join(parsersDir, file)
      let content = fs.readFileSync(filePath, "utf-8")
      const lines = content.split("\n")
      const updatedLines = []
      for (let line of lines) {
        updatedLines.push(line)
        for (let parserId in popularityData) {
          if (line.startsWith(parserId)) {
            updatedLines.push(` popularity ${popularityData[parserId].toFixed(6)}`)
          }
        }
      }
      fs.writeFileSync(filePath, updatedLines.join("\n"))
    }
  }
}

// Main function
function main(csvFilePaths, parsersDir) {
  const mergedData = mergeCSVData(csvFilePaths)
  const popularityData = calculatePopularity(mergedData)
  updateParserFiles(popularityData, parsersDir)
  console.log("Processing completed successfully.")
}

// Usage example
const csvFilePaths = [
  "/Users/breck/scroll/parserUsage.csv",
  "/Users/breck/breckster/breckyunits.com/parserUsage.csv",
  "/Users/breck/pldb/blog/parserUsage.csv"
  // Add more CSV file paths as needed
]
const parsersDir = path.join(__dirname, "parsers")

main(csvFilePaths, parsersDir)
