/* textile table parser */

const re = require('../re');
const merge = require('../merge');
const ribbon = require('../ribbon');

const { parseAttr } = require('./attr');
const { parsePhrase } = require('./phrase');
const { reIndent } = require('../jsonml');

const { txattr } = require('./re_ext');
re.pattern.txattr = txattr;

const reTable = re.compile(/^((?:table[:txattr:]\.(?:\s(.+?))\s*\n)?(?:(?:[:txattr:]\.[^\n\S]*)?\|.*?\|[^\n\S]*(?:\n|$))+)([^\n\S]*\n+)?/, 's');
const reHead = /^table(_?)([^\n]*?)\.(?:[ \t](.+?))?\s*\n/;
const reRow = re.compile(/^(?:\|([~^-][:txattr:])\.\s*\n)?([:txattr:]\.[^\n\S]*)?\|(.*?)\|[^\n\S]*(\n|$)/, 's');
const reCaption = /^\|=([^\n+]*)\n/;
const reColgroup = /^\|:([^\n+]*)\|[\r\t ]*\n/;
const reRowgroup = /^\|([\^\-~])([^\n+]*)\.[ \t\r]*\n/;

const charToTag = {
  '^': 'thead',
  '~': 'tfoot',
  '-': 'tbody'
};

function parseColgroup (src) {
  const colgroup = [ 'colgroup', {} ];
  src.split('|')
    .forEach(function (s, isCol) {
      const col = (isCol) ? {} : colgroup[1];
      let d = s.trim();
      let m;
      if (d) {
        if ((m = /^\\(\d+)/.exec(d))) {
          col.span = +m[1];
          d = d.slice(m[0].length);
        }
        if ((m = parseAttr(d, 'col'))) {
          merge(col, m[1]);
          d = d.slice(m[0]);
        }
        if ((m = /\b\d+\b/.exec(d))) {
          col.width = +m[0];
        }
      }
      if (isCol) {
        colgroup.push('\n\t\t', [ 'col', col ]);
      }
    });
  return colgroup.concat([ '\n\t' ]);
}

function testTable (src) {
  return reTable.exec(src);
}

function parseTable (src, options) {
  src = ribbon(src.trim());

  const rowgroups = [];
  let colgroup;
  let caption;
  const tAttr = {};
  let tCurr;
  let row;
  let inner;
  let pba;
  let more;
  let m;
  let extended = 0;

  const setRowGroup = function (type, pba) {
    tCurr = [ type, pba || {} ];
    rowgroups.push(tCurr);
  };

  if ((m = reHead.exec(src))) {
    // parse and apply table attr
    src.advance(m[0]);
    pba = parseAttr(m[2], 'table');
    if (pba) {
      merge(tAttr, pba[1]);
    }
    if (m[3]) {
      tAttr.summary = m[3];
    }
  }

  // caption
  if ((m = reCaption.exec(src))) {
    caption = [ 'caption' ];
    if ((pba = parseAttr(m[1], 'caption'))) {
      caption.push(pba[1]);
      m[1] = m[1].slice(pba[0]);
    }
    if (/\./.test(m[1])) { // mandatory "."
      caption.push(m[1].slice(1).replace(/\|\s*$/, '').trim());
      extended++;
      src.advance(m[0]);
    }
    else {
      caption = null;
    }
  }

  do {
    // colgroup
    if ((m = reColgroup.exec(src))) {
      colgroup = parseColgroup(m[1]);
      extended++;
    }
    // "rowgroup" (tbody, thead, tfoot)
    else if ((m = reRowgroup.exec(src))) {
      // PHP allows any amount of these in any order
      // and simply translates them straight through
      // the same is done here.
      const tag = charToTag[m[1]] || 'tbody';
      pba = parseAttr(`${m[2]} `, tag);
      setRowGroup(tag, pba && pba[1]);
      extended++;
    }
    // row
    else if ((m = reRow.exec(src))) {
      if (!tCurr) { setRowGroup('tbody'); }

      row = [ 'tr' ];

      if (m[2] && (pba = parseAttr(m[2], 'tr'))) {
        // FIXME: requires "\.\s?" -- else what ?
        row.push(pba[1]);
      }

      tCurr.push('\n\t\t', row);
      inner = ribbon(m[3]);

      do {
        inner.save();

        // cell loop
        const th = inner.startsWith('_');
        let cell = [ th ? 'th' : 'td' ];
        if (th) {
          inner.advance(1);
        }

        pba = parseAttr(inner, 'td');
        if (pba) {
          inner.advance(pba[0]);
          cell.push(pba[1]); // FIXME: don't do this if next text fails
        }

        if (pba || th) {
          const p = /^\.\s*/.exec(inner);
          if (p) {
            inner.advance(p[0]);
          }
          else {
            cell = [ 'td' ];
            inner.load();
          }
        }

        const mx = /^(==.*?==|[^|])*/.exec(inner);
        cell = cell.concat(parsePhrase(mx[0], options));
        row.push('\n\t\t\t', cell);
        more = inner.valueOf().charAt(mx[0].length) === '|';
        inner.advance(mx[0].length + 1);
      }
      while (more);

      row.push('\n\t\t');
    }
    //
    if (m) {
      src.advance(m[0]);
    }
  }
  while (m);

  // assemble table
  let table = [ 'table', tAttr ];
  if (extended) {
    if (caption) {
      table.push('\n\t', caption);
    }
    if (colgroup) {
      table.push('\n\t', colgroup);
    }
    rowgroups.forEach(function (tbody) {
      table.push('\n\t', tbody.concat([ '\n\t' ]));
    });
  }
  else {
    table = table.concat(reIndent(rowgroups[0].slice(2), -1));
  }

  table.push('\n');
  return table;
}

module.exports = {
  parseColgroup: parseColgroup,
  parseTable: parseTable,
  testTable: testTable
};
