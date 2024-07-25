class Heatrix {
  static HeatrixId = 0
  uid = Heatrix.HeatrixId++
  constructor(program) {
    const tree = new TreeNode(program)
    this.program = tree
    const table = tree.getNode("table").childrenToString()
    const scale = tree.getNode("scale")?.childrenToString() || "transparent 1"
    const thresholds = []
    const colors = []
    scale.split("\n").map(line => {
      const parts = line.split(" ")
      thresholds.push(parseFloat(parts[1]))
      colors.push(parts[0])
    })
    const colorCount = colors.length
    const colorFunction = value => {
      if (isNaN(value)) return "" // #ebedf0
      for (let index = 0; index < colorCount; index++) {
        const threshold = thresholds[index]
        if (value <= threshold) return colors[index]
      }
      return colors[colorCount - 1]
    }
    const { globalStyles } = this
    const getSize = (directives, prefix) => directives.filter(directive => directive.startsWith(prefix)).map(dir => dir.replace(prefix, "") + "px")[0] ?? ""
    this.table = table.split("\n").map(line =>
      line
        .trimEnd()
        .split(" ")
        .map(cell => {
          const words = cell.split(" ").filter(word => !word.startsWith("%"))
          const directives = cell.split(" ").filter(word => word.startsWith("%"))
          const value = parseFloat(words[0])
          let label = ""
          if (words[0]) {
            label = words.join(" ").replace(/^@@/, "") // Temporary way to force a string.
          }
          const alignment = directives.includes("%right") ? "right" : directives.includes("%left") ? "left" : ""
          const color = colorFunction(value)
          const width = getSize(directives, "%w") || globalStyles.width
          const height = getSize(directives, "%h") || globalStyles.height
          const fontSize = getSize(directives, "%fs") || globalStyles["font-size"]
          const lineHeight = getSize(directives, "%lh") || height
          const style = {
            "background-color": color,
            width,
            height,
            "font-size": fontSize,
            "line-height": lineHeight,
            "text-align": alignment
          }
          Object.keys(style).forEach(key => {
            if (style[key] === "") delete style[key]
          })
          return {
            value,
            label,
            style
          }
        })
    )
  }
  get globalStyles() {
    return this.program.getNode("style")?.asObject || {}
  }
  get html() {
    const { program } = this
    const cssId = `#heatrix${this.uid}`
    const { globalStyles } = this
    console.log(globalStyles)
    const defaultWidth = globalStyles.width || "20px"
    const defaultHeight = globalStyles.height || "20px"
    const fontSize = globalStyles["font-size"] || "10px"
    const lineHeight = globalStyles["line-height"] || defaultHeight
    const style = `<style>
      .heatrixContainer {
        margin: auto;
      }.heatrixRow {white-space: nowrap;}
  ${cssId} .heatrixCell {
    font-family: arial;
    border-radius: 2px;
    border: 1px solid transparent;
    display: inline-block;
    margin: 1px;
    text-align: center;
    vertical-align: middle;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .heatrixCell a {
    color: black;
  }
  ${cssId} .heatrixCell{
   width: ${defaultWidth};
   height: ${defaultHeight};
   font-size: ${fontSize};
   line-height: ${lineHeight};
  }
  </style>`
    const firstRow = this.table[0]
    return (
      `<div class="heatrixContainer" id="heatrix${this.uid}">${style}` +
      this.table
        .map((row, rowIndex) => {
          if (!rowIndex) return ""
          const rowStyle = row[0].style
          return `<div class="heatrixRow heatrixRow${rowIndex}">${row
            .map((cell, columnIndex) => {
              if (!columnIndex) return ""
              const columnStyle = firstRow[columnIndex]?.style || {}
              let { value, label, style } = cell
              if (label === "0") label = "~"
              const extendedStyle = Object.assign({}, rowStyle, columnStyle, style)
              const inlineStyle = Object.keys(extendedStyle)
                .map(key => `${key}:${extendedStyle[key]};`)
                .join("")
              let valueClass = value ? " valueCell" : ""
              return `<div class="heatrixCell heatrixColumn${columnIndex}${valueClass}" style="${inlineStyle}"><span title="${label}">${label}</span></div>`
            })
            .join("")}</div>`
        })
        .join("\n") +
      "</div>"
    ).replace(/\n/g, "")
  }
}