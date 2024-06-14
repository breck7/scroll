/* definitions list parser */

const ribbon = require('../ribbon');

const reDeflist = /^((?:- (?:[^\n]\n?)+?)+:=(?: *\n[^\0]+?=:(?:\n|$)|(?:[^\0]+?(?:$|\n(?=\n|- )))))+/;
const reItem = /^((?:- (?:[^\n]\n?)+?)+):=( *\n[^\0]+?=:\s*(?:\n|$)|(?:[^\0]+?(?:$|\n(?=\n|- ))))/;

function testDefList (src) {
  return reDeflist.exec(src);
}

function parseDefList (src, options) {
  src = ribbon(src.trim());

  // late loading to get around the lack of non-circular-dependency support in RequireJS
  const parsePhrase = require('./phrase').parsePhrase;
  const parseFlow = require('./flow').parseFlow;

  const deflist = [ 'dl', '\n' ];
  let terms;
  let def;
  let m;

  while ((m = reItem.exec(src))) {
    // add terms
    terms = m[1].split(/(?:^|\n)- /).slice(1);
    while (terms.length) {
      deflist.push('\t',
        [ 'dt' ].concat(parsePhrase(terms.shift().trim(), options)),
        '\n'
      );
    }
    // add definitions
    def = m[2].trim();
    deflist.push('\t',
      [ 'dd' ].concat(
        (/=:$/.test(def))
          ? parseFlow(def.slice(0, -2).trim(), options)
          : parsePhrase(def, options)
      ), '\n'
    );
    src.advance(m[0]);
  }
  return deflist;
}

exports.testDefList = testDefList;
exports.parseDefList = parseDefList;
