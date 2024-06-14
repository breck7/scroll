const reClassid = /^\(([^()\n]+)\)/;
const rePaddingL = /^(\(+)/;
const rePaddingR = /^(\)+)/;
const reAlignBlock = /^(<>|<|>|=)/;
const reAlignImg = /^(<|>|=)/;
const reVAlign = /^(~|\^|-)/;
const reColSpan = /^\\(\d+)/;
const reRowSpan = /^\/(\d+)/;
const reStyles = /^\{([^}]*)\}/;
const reCSS = /^\s*([^:\s]+)\s*:\s*(.+)\s*$/;
const reLang = /^\[([^[\]\n]+)\]/;

const pbaAlignLookup = {
  '<': 'left',
  '=': 'center',
  '>': 'right',
  '<>': 'justify'
};

const pbaVAlignLookup = {
  '~': 'bottom',
  '^': 'top',
  '-': 'middle'
};

function copyAttr (s, blacklist) {
  if (!s) { return undefined; }
  const d = {};
  for (const k in s) {
    if (k in s && (!blacklist || !(k in blacklist))) {
      d[k] = s[k];
    }
  }
  return d;
}

function testBlock (name) {
  // "in" test would be better but what about fn#.?
  return /^(?:table|t[dh]|t(?:foot|head|body)|b[qc]|div|notextile|pre|h[1-6]|fn\\d+|p|###)$/.test(name);
}

/*
  The attr bit causes massive problems for span elements when parentheses are used.
  Parentheses are a total mess and, unsurprisingly, cause trip-ups:

   RC: `_{display:block}(span) span (span)_` -> `<em style="display:block;" class="span">(span) span (span)</em>`
   PHP: `_{display:block}(span) span (span)_` -> `<em style="display:block;">(span) span (span)</em>`

  PHP and RC seem to mostly solve this by not parsing a final attr parens on spans if the
  following character is a non-space. I've duplicated that: Class/ID is not matched on spans
  if it is followed by `endToken` or <space>.

  Lang is not matched here if it is followed by the end token. Theoretically I could limit the lang
  attribute to /^\[[a-z]{2+}(\-[a-zA-Z0-9]+)*\]/ because Textile is layered on top of HTML which
  only accepts valid BCP 47 language tags, but who knows what atrocities are being preformed
  out there in the real world. So this attempts to emulate the other libraries.
*/
function parseAttr (input, element, endToken) {
  input = String(input);
  if (!input || element === 'notextile') {
    return undefined;
  }

  let m;
  const st = {};
  const o = { style: st };
  let remaining = input;

  const isBlock = testBlock(element);
  const isImg = element === 'img';
  const isList = element === 'li';
  const isPhrase = !isBlock && !isImg && element !== 'a';
  const reAlign = (isImg) ? reAlignImg : reAlignBlock;

  do {
    if ((m = reStyles.exec(remaining))) {
      m[1].split(';').forEach(function (p) {
        const d = p.match(reCSS);
        if (d) { st[d[1]] = d[2]; }
      });
      remaining = remaining.slice(m[0].length);
      continue;
    }

    if ((m = reLang.exec(remaining))) {
      const rm = remaining.slice(m[0].length);
      if ((!rm && isPhrase) ||
           (endToken && endToken === rm.slice(0, endToken.length))) {
        m = null;
      }
      else {
        o.lang = m[1];
        remaining = remaining.slice(m[0].length);
      }
      continue;
    }

    if ((m = reClassid.exec(remaining))) {
      const rm = remaining.slice(m[0].length);
      if (
        (!rm && isPhrase) ||
          (endToken && (rm[0] === ' ' || endToken === rm.slice(0, endToken.length)))
      ) {
        m = null;
      }
      else {
        const bits = m[1].split('#');
        if (bits[0]) { o.class = bits[0]; }
        if (bits[1]) { o.id = bits[1]; }
        remaining = rm;
      }
      continue;
    }

    if (isBlock || isList) {
      if ((m = rePaddingL.exec(remaining))) {
        st['padding-left'] = `${m[1].length}em`;
        remaining = remaining.slice(m[0].length);
        continue;
      }
      if ((m = rePaddingR.exec(remaining))) {
        st['padding-right'] = `${m[1].length}em`;
        remaining = remaining.slice(m[0].length);
        continue;
      }
    }

    // only for blocks:
    if (isImg || isBlock || isList) {
      if ((m = reAlign.exec(remaining))) {
        const align = pbaAlignLookup[m[1]];
        if (isImg) {
          o.align = align;
        }
        else {
          st['text-align'] = align;
        }
        remaining = remaining.slice(m[0].length);
        continue;
      }
    }

    // only for table cells
    if (element === 'td' || element === 'tr') {
      if ((m = reVAlign.exec(remaining))) {
        st['vertical-align'] = pbaVAlignLookup[m[1]];
        remaining = remaining.slice(m[0].length);
        continue;
      }
    }
    if (element === 'td') {
      if ((m = reColSpan.exec(remaining))) {
        o.colspan = m[1];
        remaining = remaining.slice(m[0].length);
        continue;
      }
      if ((m = reRowSpan.exec(remaining))) {
        o.rowspan = m[1];
        remaining = remaining.slice(m[0].length);
        continue;
      }
    }
  }
  while (m);

  // collapse styles
  const s = [];
  for (const v in st) {
    s.push(`${v}:${st[v]}`);
  }
  if (s.length) {
    o.style = s.join(';');
  }
  else {
    delete o.style;
  }

  return (remaining === input) ? undefined : [ input.length - remaining.length, o ];
}

module.exports = {
  copyAttr: copyAttr,
  parseAttr: parseAttr
};
