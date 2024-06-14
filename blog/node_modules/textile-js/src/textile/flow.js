/*
** textile flow content parser
*/
const builder = require('../builder');
const ribbon = require('../ribbon');
const re = require('../re');
const fixLinks = require('../fixlinks');

const { parseHtml, tokenize, parseHtmlAttr, singletons, testComment, testOpenTagBlock } = require('../html');

const { parsePhrase } = require('./phrase');
const { copyAttr, parseAttr } = require('./attr');
const { testList, parseList } = require('./list');
const { testDefList, parseDefList } = require('./deflist');
const { testTable, parseTable } = require('./table');

const { txblocks, txlisthd, txattr } = require('./re_ext');
re.pattern.txblocks = txblocks;
re.pattern.txlisthd = txlisthd;
re.pattern.txattr = txattr;

// HTML tags allowed in the document (root) level that trigger HTML parsing
const allowedBlocktags = {
  p: 0,
  hr: 0,
  ul: 1,
  ol: 0,
  li: 0,
  div: 1,
  pre: 0,
  object: 1,
  script: 0,
  noscript: 0,
  blockquote: 1,
  notextile: 1
};

const reBlock = re.compile(/^([:txblocks:])/);
const reBlockNormal = re.compile(/^(.*?)($|\r?\n(?=[:txlisthd:])|\r?\n(?:\s*\n|$)+)/, 's');
const reBlockExtended = re.compile(/^(.*?)($|\r?\n(?=[:txlisthd:])|\r?\n+(?=[:txblocks:][:txattr:]\.))/, 's');
const reBlockNormalPre = re.compile(/^(.*?)($|\r?\n(?:\s*\n|$)+)/, 's');
const reBlockExtendedPre = re.compile(/^(.*?)($|\r?\n+(?=[:txblocks:][:txattr:]\.))/, 's');

const reRuler = /^(---+|\*\*\*+|___+)(\r?\n\s+|$)/;
const reLinkRef = re.compile(/^\[([^\]]+)\]((?:https?:\/\/|\/)\S+)(?:\s*\n|$)/);
const reFootnoteDef = /^fn\d+$/;

const hasOwn = Object.prototype.hasOwnProperty;
function extend (target, ...args) {
  for (let i = 1; i < args.length; i++) {
    const src = args[i];
    if (src != null) {
      for (const nextKey in src) {
        if (hasOwn.call(src, nextKey)) {
          target[nextKey] = src[nextKey];
        }
      }
    }
  }
  return target;
}


function paragraph (s, tag, pba, linebreak, options) {
  tag = tag || 'p';
  let out = [];
  s.split(/(?:\r?\n){2,}/).forEach(function (bit, i) {
    if (tag === 'p' && /^\s/.test(bit)) {
      // no-paragraphs
      bit = bit.replace(/\r?\n[\t ]/g, ' ').trim();
      out = out.concat(parsePhrase(bit, options));
    }
    else {
      if (linebreak && i) { out.push(linebreak); }
      out.push(pba ? [ tag, pba ].concat(parsePhrase(bit, options))
        : [ tag ].concat(parsePhrase(bit, options)));
    }
  });
  return out;
};

function parseFlow (src, options) {
  const list = builder();

  let linkRefs;
  let m;

  src = ribbon(src.replace(/^( *\r?\n)+/, ''));

  // loop
  while (src.valueOf()) {
    src.save();

    // link_ref -- this goes first because it shouldn't trigger a linebreak
    if ((m = reLinkRef.exec(src))) {
      if (!linkRefs) { linkRefs = {}; }
      src.advance(m[0]);
      linkRefs[m[1]] = m[2];
      continue;
    }

    // add linebreak
    list.linebreak();

    // named block
    if ((m = reBlock.exec(src))) {
      src.advance(m[0]);
      const blockType = m[0];
      let pba = parseAttr(src, blockType);

      if (pba) {
        src.advance(pba[0]);
        pba = pba[1];
      }
      if ((m = /^\.(\.?)(?:\s|(?=:))/.exec(src))) {
        // FIXME: this whole copyAttr seems rather strange?
        // slurp rest of block
        const extended = !!m[1];
        let reBlockGlob = (extended ? reBlockExtended : reBlockNormal);
        if (blockType === 'bc' || blockType === 'pre') {
          reBlockGlob = (extended ? reBlockExtendedPre : reBlockNormalPre);
        }
        m = reBlockGlob.exec(src.advance(m[0]));
        src.advance(m[0]);
        // bq | bc | notextile | pre | h# | fn# | p | ###
        if (blockType === 'bq') {
          let inner = m[1];
          if ((m = /^:(\S+)\s+/.exec(inner))) {
            if (!pba) { pba = {}; }
            pba.cite = m[1];
            inner = inner.slice(m[0].length);
          }
          // RedCloth adds all attr to both: this is bad because it produces duplicate IDs
          const par = paragraph(inner, 'p', copyAttr(pba, { cite: 1, id: 1 }), '\n', options);
          list.add([ 'blockquote', pba, '\n' ].concat(par).concat([ '\n' ]));
        }
        else if (blockType === 'bc') {
          const subPba = (pba) ? copyAttr(pba, { id: 1 }) : null;
          list.add([ 'pre', pba, (subPba ? [ 'code', subPba, m[1] ] : [ 'code', m[1] ]) ]);
        }
        else if (blockType === 'notextile') {
          list.merge(parseHtml(tokenize(m[1])));
        }
        else if (blockType === '###') {
          // ignore the insides
        }
        else if (blockType === 'pre') {
          // I disagree with RedCloth, but agree with PHP here:
          // "pre(foo#bar).. line1\n\nline2" prevents multiline preformat blocks
          // ...which seems like the whole point of having an extended pre block?
          list.add([ 'pre', pba, m[1] ]);
        }
        else if (reFootnoteDef.test(blockType)) { // footnote
          // Need to be careful: RedCloth fails "fn1(foo#m). footnote" -- it confuses the ID
          const fnid = blockType.replace(/\D+/g, '');
          if (!pba) { pba = {}; }
          pba.class = (pba.class ? pba.class + ' ' : '') + 'footnote';
          pba.id = 'fn' + fnid;
          list.add([ 'p', pba, [ 'a', { href: '#fnr' + fnid }, [ 'sup', fnid ] ], ' ' ]
            .concat(parsePhrase(m[1], options)));
        }
        else { // heading | paragraph
          list.merge(paragraph(m[1], blockType, pba, '\n', options));
        }
        continue;
      }
      else {
        src.load();
      }
    }

    // HTML comment
    if ((m = testComment(src))) {
      src.advance(m[0] + (/(?:\s*\n+)+/.exec(src) || [])[0]);
      list.add([ '!', m[1] ]);
      continue;
    }

    // block HTML
    if ((m = testOpenTagBlock(src))) {
      const tag = m[1];

      // Is block tag? ...
      if (tag in allowedBlocktags) {
        if (m[3] || tag in singletons) { // single?
          src.advance(m[0]);
          if (/^\s*(\n|$)/.test(src)) {
            const elm = [ tag ];
            if (m[2]) { elm.push(parseHtmlAttr(m[2])); }
            list.add(elm);
            src.skipWS();
            continue;
          }
        }
        else if (tag === 'pre') {
          const t = tokenize(src, { pre: 1, code: 1 }, tag);
          const p = parseHtml(t, true);
          src.load().advance(p.sourceLength);
          if (/^\s*(\n|$)/.test(src)) {
            list.merge(p);
            src.skipWS(); // skip tailing whitespace
            continue;
          }
        }
        else if (tag === 'notextile') {
          // merge all child elements
          const t = tokenize(src, null, tag);
          let s = 1; // start after open tag
          while (/^\s+$/.test(t[s].src)) {
            s++; // skip whitespace
          }
          const p = parseHtml(t.slice(s, -1), true);
          const x = t.pop();
          src.load().advance(x.pos + x.src.length);
          if (/^\s*(\n|$)/.test(src)) {
            list.merge(p);
            src.skipWS(); // skip tailing whitespace
            continue;
          }
        }
        else {
          src.skipWS();
          const t = tokenize(src, null, tag);
          const x = t.pop(); // this should be the end tag
          let s = 1; // start after open tag
          while (t[s] && /^[\n\r]+$/.test(t[s].src)) {
            s++; // skip whitespace
          }
          if (x.tag === tag) {
            // inner can be empty
            const inner = (t.length > 1) ? src.slice(t[s].pos, x.pos) : '';
            src.advance(x.pos + x.src.length);
            if (/^\s*(\n|$)/.test(src)) {
              let elm = [ tag ];
              if (m[2]) { elm.push(parseHtmlAttr(m[2])); }
              if (tag === 'script' || tag === 'style') {
                elm.push(inner);
              }
              else {
                const innerHTML = inner.replace(/^\n+/, '').replace(/\s*$/, '');
                const isBlock = /\n\r?\n/.test(innerHTML) || tag === 'ol' || tag === 'ul';
                const innerElm = isBlock
                  ? parseFlow(innerHTML, options)
                  : parsePhrase(innerHTML, extend({}, options, { breaks: false }));
                if (isBlock || /^\n/.test(inner)) {
                  elm.push('\n');
                }
                if (isBlock || /\s$/.test(inner)) {
                  innerElm.push('\n');
                }
                elm = elm.concat(innerElm);
              }

              list.add(elm);
              src.skipWS(); // skip tailing whitespace
              continue;
            }
          }
        }
      }
      src.load();
    }

    // ruler
    if ((m = reRuler.exec(src))) {
      src.advance(m[0]);
      list.add([ 'hr' ]);
      continue;
    }

    // list
    if ((m = testList(src))) {
      src.advance(m[0]);
      list.add(parseList(m[0], options));
      continue;
    }

    // definition list
    if ((m = testDefList(src))) {
      src.advance(m[0]);
      list.add(parseDefList(m[0], options));
      continue;
    }

    // table
    if ((m = testTable(src))) {
      src.advance(m[0]);
      list.add(parseTable(m[1], options));
      continue;
    }

    // paragraph
    m = reBlockNormal.exec(src);
    list.merge(paragraph(m[1], 'p', undefined, '\n', options));
    src.advance(m[0]);
  }

  return linkRefs ? fixLinks(list.get(), linkRefs) : list.get();
}

exports.parseFlow = parseFlow;
