function convertToScrollset(data, delimiter = "|") {
  const lines = data.trim().split("\n")
  const headers = lines[0].split(delimiter)

  let scrollset = ""

  // Create parser definitions
  headers.forEach((header, index) => {
    const parserId = header.toLowerCase() + "Parser"
    scrollset += `${parserId}\n`
    scrollset += ` extends abstract${capitalizeFirstLetter(getParserType(header))}Parser\n`
    scrollset += ` float sortIndex ${1 + (index + 1) / 10}\n\n`
  })

  // Create entries
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter)
    if (values.length !== headers.length) continue

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j].toLowerCase()
      const value = values[j].trim()
      if (value) {
        scrollset += `${header} ${value}\n`
      }
    }

    scrollset += "\n"
  }

  return scrollset
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function getParserType(header) {
  const lowerHeader = header.toLowerCase()
  if (lowerHeader === "id") return "Id"
  if (lowerHeader.includes("link") || lowerHeader === "twitter") return "UrlMeasure"
  else if (lowerHeader === "year" || lowerHeader === "day" || lowerHeader === "days") return "IntegerMeasure"
  else return "StringMeasure"
}
