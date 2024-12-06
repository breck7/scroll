// https://github.com/nayuki/QR-Code-generator
var qrcodegen
!(function (t) {
  class e {
    static encodeText(r, n) {
      const o = t.QrSegment.makeSegments(r)
      return e.encodeSegments(o, n)
    }
    static encodeBinary(r, n) {
      const o = t.QrSegment.makeBytes(r)
      return e.encodeSegments([o], n)
    }
    static encodeSegments(t, n, i = 1, a = 40, l = -1, h = !0) {
      if (!(e.MIN_VERSION <= i && i <= a && a <= e.MAX_VERSION) || l < -1 || l > 7) throw new RangeError("Invalid value")
      let u, c
      for (u = i; ; u++) {
        const r = 8 * e.getNumDataCodewords(u, n),
          o = s.getTotalBits(t, u)
        if (o <= r) {
          c = o
          break
        }
        if (u >= a) throw new RangeError("Data too long")
      }
      for (const t of [e.Ecc.MEDIUM, e.Ecc.QUARTILE, e.Ecc.HIGH]) h && c <= 8 * e.getNumDataCodewords(u, t) && (n = t)
      let d = []
      for (const e of t) {
        r(e.mode.modeBits, 4, d), r(e.numChars, e.mode.numCharCountBits(u), d)
        for (const t of e.getData()) d.push(t)
      }
      o(d.length == c)
      const f = 8 * e.getNumDataCodewords(u, n)
      o(d.length <= f), r(0, Math.min(4, f - d.length), d), r(0, (8 - (d.length % 8)) % 8, d), o(d.length % 8 == 0)
      for (let t = 236; d.length < f; t ^= 253) r(t, 8, d)
      let m = []
      for (; 8 * m.length < d.length; ) m.push(0)
      return d.forEach((t, e) => (m[e >>> 3] |= t << (7 - (7 & e)))), new e(u, n, m, l)
    }
    constructor(t, r, n, s) {
      if (((this.version = t), (this.errorCorrectionLevel = r), (this.modules = []), (this.isFunction = []), t < e.MIN_VERSION || t > e.MAX_VERSION)) throw new RangeError("Version value out of range")
      if (s < -1 || s > 7) throw new RangeError("Mask value out of range")
      this.size = 4 * t + 17
      let i = []
      for (let t = 0; t < this.size; t++) i.push(!1)
      for (let t = 0; t < this.size; t++) this.modules.push(i.slice()), this.isFunction.push(i.slice())
      this.drawFunctionPatterns()
      const a = this.addEccAndInterleave(n)
      if ((this.drawCodewords(a), -1 == s)) {
        let t = 1e9
        for (let e = 0; e < 8; e++) {
          this.applyMask(e), this.drawFormatBits(e)
          const r = this.getPenaltyScore()
          r < t && ((s = e), (t = r)), this.applyMask(e)
        }
      }
      o(0 <= s && s <= 7), (this.mask = s), this.applyMask(s), this.drawFormatBits(s), (this.isFunction = [])
    }
    getModule(t, e) {
      return 0 <= t && t < this.size && 0 <= e && e < this.size && this.modules[e][t]
    }
    drawFunctionPatterns() {
      for (let t = 0; t < this.size; t++) this.setFunctionModule(6, t, t % 2 == 0), this.setFunctionModule(t, 6, t % 2 == 0)
      this.drawFinderPattern(3, 3), this.drawFinderPattern(this.size - 4, 3), this.drawFinderPattern(3, this.size - 4)
      const t = this.getAlignmentPatternPositions(),
        e = t.length
      for (let r = 0; r < e; r++) for (let n = 0; n < e; n++) (0 == r && 0 == n) || (0 == r && n == e - 1) || (r == e - 1 && 0 == n) || this.drawAlignmentPattern(t[r], t[n])
      this.drawFormatBits(0), this.drawVersion()
    }
    drawFormatBits(t) {
      const e = (this.errorCorrectionLevel.formatBits << 3) | t
      let r = e
      for (let t = 0; t < 10; t++) r = (r << 1) ^ (1335 * (r >>> 9))
      const s = 21522 ^ ((e << 10) | r)
      o(s >>> 15 == 0)
      for (let t = 0; t <= 5; t++) this.setFunctionModule(8, t, n(s, t))
      this.setFunctionModule(8, 7, n(s, 6)), this.setFunctionModule(8, 8, n(s, 7)), this.setFunctionModule(7, 8, n(s, 8))
      for (let t = 9; t < 15; t++) this.setFunctionModule(14 - t, 8, n(s, t))
      for (let t = 0; t < 8; t++) this.setFunctionModule(this.size - 1 - t, 8, n(s, t))
      for (let t = 8; t < 15; t++) this.setFunctionModule(8, this.size - 15 + t, n(s, t))
      this.setFunctionModule(8, this.size - 8, !0)
    }
    drawVersion() {
      if (this.version < 7) return
      let t = this.version
      for (let e = 0; e < 12; e++) t = (t << 1) ^ (7973 * (t >>> 11))
      const e = (this.version << 12) | t
      o(e >>> 18 == 0)
      for (let t = 0; t < 18; t++) {
        const r = n(e, t),
          o = this.size - 11 + (t % 3),
          s = Math.floor(t / 3)
        this.setFunctionModule(o, s, r), this.setFunctionModule(s, o, r)
      }
    }
    drawFinderPattern(t, e) {
      for (let r = -4; r <= 4; r++)
        for (let n = -4; n <= 4; n++) {
          const o = Math.max(Math.abs(n), Math.abs(r)),
            s = t + n,
            i = e + r
          0 <= s && s < this.size && 0 <= i && i < this.size && this.setFunctionModule(s, i, 2 != o && 4 != o)
        }
    }
    drawAlignmentPattern(t, e) {
      for (let r = -2; r <= 2; r++) for (let n = -2; n <= 2; n++) this.setFunctionModule(t + n, e + r, 1 != Math.max(Math.abs(n), Math.abs(r)))
    }
    setFunctionModule(t, e, r) {
      ;(this.modules[e][t] = r), (this.isFunction[e][t] = !0)
    }
    addEccAndInterleave(t) {
      const r = this.version,
        n = this.errorCorrectionLevel
      if (t.length != e.getNumDataCodewords(r, n)) throw new RangeError("Invalid argument")
      const s = e.NUM_ERROR_CORRECTION_BLOCKS[n.ordinal][r],
        i = e.ECC_CODEWORDS_PER_BLOCK[n.ordinal][r],
        a = Math.floor(e.getNumRawDataModules(r) / 8),
        l = s - (a % s),
        h = Math.floor(a / s)
      let u = []
      const c = e.reedSolomonComputeDivisor(i)
      for (let r = 0, n = 0; r < s; r++) {
        let o = t.slice(n, n + h - i + (r < l ? 0 : 1))
        n += o.length
        const s = e.reedSolomonComputeRemainder(o, c)
        r < l && o.push(0), u.push(o.concat(s))
      }
      let d = []
      for (let t = 0; t < u[0].length; t++)
        u.forEach((e, r) => {
          ;(t != h - i || r >= l) && d.push(e[t])
        })
      return o(d.length == a), d
    }
    drawCodewords(t) {
      if (t.length != Math.floor(e.getNumRawDataModules(this.version) / 8)) throw new RangeError("Invalid argument")
      let r = 0
      for (let e = this.size - 1; e >= 1; e -= 2) {
        6 == e && (e = 5)
        for (let o = 0; o < this.size; o++)
          for (let s = 0; s < 2; s++) {
            const i = e - s,
              a = 0 == ((e + 1) & 2) ? this.size - 1 - o : o
            !this.isFunction[a][i] && r < 8 * t.length && ((this.modules[a][i] = n(t[r >>> 3], 7 - (7 & r))), r++)
          }
      }
      o(r == 8 * t.length)
    }
    applyMask(t) {
      if (t < 0 || t > 7) throw new RangeError("Mask value out of range")
      for (let e = 0; e < this.size; e++)
        for (let r = 0; r < this.size; r++) {
          let n
          switch (t) {
            case 0:
              n = (r + e) % 2 == 0
              break
            case 1:
              n = e % 2 == 0
              break
            case 2:
              n = r % 3 == 0
              break
            case 3:
              n = (r + e) % 3 == 0
              break
            case 4:
              n = (Math.floor(r / 3) + Math.floor(e / 2)) % 2 == 0
              break
            case 5:
              n = ((r * e) % 2) + ((r * e) % 3) == 0
              break
            case 6:
              n = (((r * e) % 2) + ((r * e) % 3)) % 2 == 0
              break
            case 7:
              n = (((r + e) % 2) + ((r * e) % 3)) % 2 == 0
              break
            default:
              throw new Error("Unreachable")
          }
          !this.isFunction[e][r] && n && (this.modules[e][r] = !this.modules[e][r])
        }
    }
    getPenaltyScore() {
      let t = 0
      for (let r = 0; r < this.size; r++) {
        let n = !1,
          o = 0,
          s = [0, 0, 0, 0, 0, 0, 0]
        for (let i = 0; i < this.size; i++)
          this.modules[r][i] == n ? (o++, 5 == o ? (t += e.PENALTY_N1) : o > 5 && t++) : (this.finderPenaltyAddHistory(o, s), n || (t += this.finderPenaltyCountPatterns(s) * e.PENALTY_N3), (n = this.modules[r][i]), (o = 1))
        t += this.finderPenaltyTerminateAndCount(n, o, s) * e.PENALTY_N3
      }
      for (let r = 0; r < this.size; r++) {
        let n = !1,
          o = 0,
          s = [0, 0, 0, 0, 0, 0, 0]
        for (let i = 0; i < this.size; i++)
          this.modules[i][r] == n ? (o++, 5 == o ? (t += e.PENALTY_N1) : o > 5 && t++) : (this.finderPenaltyAddHistory(o, s), n || (t += this.finderPenaltyCountPatterns(s) * e.PENALTY_N3), (n = this.modules[i][r]), (o = 1))
        t += this.finderPenaltyTerminateAndCount(n, o, s) * e.PENALTY_N3
      }
      for (let r = 0; r < this.size - 1; r++)
        for (let n = 0; n < this.size - 1; n++) {
          const o = this.modules[r][n]
          o == this.modules[r][n + 1] && o == this.modules[r + 1][n] && o == this.modules[r + 1][n + 1] && (t += e.PENALTY_N2)
        }
      let r = 0
      for (const t of this.modules) r = t.reduce((t, e) => t + (e ? 1 : 0), r)
      const n = this.size * this.size,
        s = Math.ceil(Math.abs(20 * r - 10 * n) / n) - 1
      return o(0 <= s && s <= 9), (t += s * e.PENALTY_N4), o(0 <= t && t <= 2568888), t
    }
    getAlignmentPatternPositions() {
      if (1 == this.version) return []
      {
        const t = Math.floor(this.version / 7) + 2,
          e = 2 * Math.floor((8 * this.version + 3 * t + 5) / (4 * t - 4))
        let r = [6]
        for (let n = this.size - 7; r.length < t; n -= e) r.splice(1, 0, n)
        return r
      }
    }
    static getNumRawDataModules(t) {
      if (t < e.MIN_VERSION || t > e.MAX_VERSION) throw new RangeError("Version number out of range")
      let r = (16 * t + 128) * t + 64
      if (t >= 2) {
        const e = Math.floor(t / 7) + 2
        ;(r -= (25 * e - 10) * e - 55), t >= 7 && (r -= 36)
      }
      return o(208 <= r && r <= 29648), r
    }
    static getNumDataCodewords(t, r) {
      return Math.floor(e.getNumRawDataModules(t) / 8) - e.ECC_CODEWORDS_PER_BLOCK[r.ordinal][t] * e.NUM_ERROR_CORRECTION_BLOCKS[r.ordinal][t]
    }
    static reedSolomonComputeDivisor(t) {
      if (t < 1 || t > 255) throw new RangeError("Degree out of range")
      let r = []
      for (let e = 0; e < t - 1; e++) r.push(0)
      r.push(1)
      let n = 1
      for (let o = 0; o < t; o++) {
        for (let t = 0; t < r.length; t++) (r[t] = e.reedSolomonMultiply(r[t], n)), t + 1 < r.length && (r[t] ^= r[t + 1])
        n = e.reedSolomonMultiply(n, 2)
      }
      return r
    }
    static reedSolomonComputeRemainder(t, r) {
      let n = r.map(t => 0)
      for (const o of t) {
        const t = o ^ n.shift()
        n.push(0), r.forEach((r, o) => (n[o] ^= e.reedSolomonMultiply(r, t)))
      }
      return n
    }
    static reedSolomonMultiply(t, e) {
      if (t >>> 8 != 0 || e >>> 8 != 0) throw new RangeError("Byte out of range")
      let r = 0
      for (let n = 7; n >= 0; n--) (r = (r << 1) ^ (285 * (r >>> 7))), (r ^= ((e >>> n) & 1) * t)
      return o(r >>> 8 == 0), r
    }
    finderPenaltyCountPatterns(t) {
      const e = t[1]
      o(e <= 3 * this.size)
      const r = e > 0 && t[2] == e && t[3] == 3 * e && t[4] == e && t[5] == e
      return (r && t[0] >= 4 * e && t[6] >= e ? 1 : 0) + (r && t[6] >= 4 * e && t[0] >= e ? 1 : 0)
    }
    finderPenaltyTerminateAndCount(t, e, r) {
      return t && (this.finderPenaltyAddHistory(e, r), (e = 0)), (e += this.size), this.finderPenaltyAddHistory(e, r), this.finderPenaltyCountPatterns(r)
    }
    finderPenaltyAddHistory(t, e) {
      0 == e[0] && (t += this.size), e.pop(), e.unshift(t)
    }
  }
  function r(t, e, r) {
    if (e < 0 || e > 31 || t >>> e != 0) throw new RangeError("Value out of range")
    for (let n = e - 1; n >= 0; n--) r.push((t >>> n) & 1)
  }
  function n(t, e) {
    return 0 != ((t >>> e) & 1)
  }
  function o(t) {
    if (!t) throw new Error("Assertion error")
  }
  ;(e.MIN_VERSION = 1),
    (e.MAX_VERSION = 40),
    (e.PENALTY_N1 = 3),
    (e.PENALTY_N2 = 3),
    (e.PENALTY_N3 = 40),
    (e.PENALTY_N4 = 10),
    (e.ECC_CODEWORDS_PER_BLOCK = [
      [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
      [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
      [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
      [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
    ]),
    (e.NUM_ERROR_CORRECTION_BLOCKS = [
      [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
      [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
      [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
      [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
    ]),
    (t.QrCode = e)
  class s {
    static makeBytes(t) {
      let e = []
      for (const n of t) r(n, 8, e)
      return new s(s.Mode.BYTE, t.length, e)
    }
    static makeNumeric(t) {
      if (!s.isNumeric(t)) throw new RangeError("String contains non-numeric characters")
      let e = []
      for (let n = 0; n < t.length; ) {
        const o = Math.min(t.length - n, 3)
        r(parseInt(t.substring(n, n + o), 10), 3 * o + 1, e), (n += o)
      }
      return new s(s.Mode.NUMERIC, t.length, e)
    }
    static makeAlphanumeric(t) {
      if (!s.isAlphanumeric(t)) throw new RangeError("String contains unencodable characters in alphanumeric mode")
      let e,
        n = []
      for (e = 0; e + 2 <= t.length; e += 2) {
        let o = 45 * s.ALPHANUMERIC_CHARSET.indexOf(t.charAt(e))
        ;(o += s.ALPHANUMERIC_CHARSET.indexOf(t.charAt(e + 1))), r(o, 11, n)
      }
      return e < t.length && r(s.ALPHANUMERIC_CHARSET.indexOf(t.charAt(e)), 6, n), new s(s.Mode.ALPHANUMERIC, t.length, n)
    }
    static makeSegments(t) {
      return "" == t ? [] : s.isNumeric(t) ? [s.makeNumeric(t)] : s.isAlphanumeric(t) ? [s.makeAlphanumeric(t)] : [s.makeBytes(s.toUtf8ByteArray(t))]
    }
    static makeEci(t) {
      let e = []
      if (t < 0) throw new RangeError("ECI assignment value out of range")
      if (t < 128) r(t, 8, e)
      else if (t < 16384) r(2, 2, e), r(t, 14, e)
      else {
        if (!(t < 1e6)) throw new RangeError("ECI assignment value out of range")
        r(6, 3, e), r(t, 21, e)
      }
      return new s(s.Mode.ECI, 0, e)
    }
    static isNumeric(t) {
      return s.NUMERIC_REGEX.test(t)
    }
    static isAlphanumeric(t) {
      return s.ALPHANUMERIC_REGEX.test(t)
    }
    constructor(t, e, r) {
      if (((this.mode = t), (this.numChars = e), (this.bitData = r), e < 0)) throw new RangeError("Invalid argument")
      this.bitData = r.slice()
    }
    getData() {
      return this.bitData.slice()
    }
    static getTotalBits(t, e) {
      let r = 0
      for (const n of t) {
        const t = n.mode.numCharCountBits(e)
        if (n.numChars >= 1 << t) return 1 / 0
        r += 4 + t + n.bitData.length
      }
      return r
    }
    static toUtf8ByteArray(t) {
      t = encodeURI(t)
      let e = []
      for (let r = 0; r < t.length; r++) "%" != t.charAt(r) ? e.push(t.charCodeAt(r)) : (e.push(parseInt(t.substring(r + 1, r + 3), 16)), (r += 2))
      return e
    }
  }
  ;(s.NUMERIC_REGEX = /^[0-9]*$/), (s.ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/), (s.ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:"), (t.QrSegment = s)
})(qrcodegen || (qrcodegen = {})),
  (function (t) {
    !(function (t) {
      class e {
        constructor(t, e) {
          ;(this.ordinal = t), (this.formatBits = e)
        }
      }
      ;(e.LOW = new e(0, 1)), (e.MEDIUM = new e(1, 0)), (e.QUARTILE = new e(2, 3)), (e.HIGH = new e(3, 2)), (t.Ecc = e)
    })(t.QrCode || (t.QrCode = {}))
  })(qrcodegen || (qrcodegen = {})),
  (function (t) {
    !(function (t) {
      class e {
        constructor(t, e) {
          ;(this.modeBits = t), (this.numBitsCharCount = e)
        }
        numCharCountBits(t) {
          return this.numBitsCharCount[Math.floor((t + 7) / 17)]
        }
      }
      ;(e.NUMERIC = new e(1, [10, 12, 14])), (e.ALPHANUMERIC = new e(2, [9, 11, 13])), (e.BYTE = new e(4, [8, 16, 16])), (e.KANJI = new e(8, [8, 10, 12])), (e.ECI = new e(7, [0, 0, 0])), (t.Mode = e)
    })(t.QrSegment || (t.QrSegment = {}))
  })(qrcodegen || (qrcodegen = {}))

function toSvgString(qr, border, lightColor = "white", darkColor = "black") {
  if (qr == null || lightColor == null || darkColor == null) {
    throw new Error("Null argument")
  }
  if (border < 0) {
    throw new Error("Border must be non-negative")
  }

  const brd = border
  let sb = []

  sb.push(`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${qr.size + brd * 2} ${qr.size + brd * 2}" stroke="none">`)
  sb.push(`\t<rect width="100%" height="100%" fill="${lightColor}"/>`)
  sb.push('\t<path d="')

  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.getModule(x, y)) {
        if (x !== 0 || y !== 0) sb.push(" ")
        sb.push(`M${x + brd},${y + brd}h1v1h-1z`)
      }
    }
  }

  sb.push(`" fill="${darkColor}"/>`)
  sb.push("</svg>")

  return sb.join("\n")
}

if (module) module.exports = { qrcodegen, toSvgString }
