/* textile inline parser */

const ribbon = require('../ribbon');
const builder = require('../builder');
const re = require('../re');

const { parseAttr } = require('./attr');
const { parseGlyph } = require('./glyph');
const { parseHtml, parseHtmlAttr, tokenize, singletons, testComment, testOpenTag } = require('../html');

const { ucaps, txattr, txcite } = require('./re_ext');
re.pattern.txattr = txattr;
re.pattern.txcite = txcite;
re.pattern.ucaps = ucaps;

const phraseConvert = {
  '*': 'strong',
  '**': 'b',
  '??': 'cite',
  '_': 'em',
  '__': 'i',
  '-': 'del',
  '%': 'span',
  '+': 'ins',
  '~': 'sub',
  '^': 'sup',
  '@': 'code'
};

const rePhrase = /^([[{]?)(__?|\*\*?|\?\?|[-+^~@%])/;
const reImage = re.compile(/^!(?!\s)([:txattr:](?:\.[^\n\S]|\.(?:[^./]))?)([^!\s]+?) ?(?:\(((?:[^()]|\([^()]+\))+)\))?!(?::([^\s]+?(?=[!-.:-@[\\\]-`{-~](?:$|\s)|\s|$)))?/);
const reImageFenced = re.compile(/^\[!(?!\s)([:txattr:](?:\.[^\n\S]|\.(?:[^./]))?)([^!\s]+?) ?(?:\(((?:[^()]|\([^()]+\))+)\))?!(?::([^\s]+?(?=[!-.:-@[\\\]-`{-~](?:$|\s)|\s|$)))?\]/);
// NB: there is an exception in here to prevent matching "TM)"
const reCaps = re.compile(/^((?!TM\)|tm\))[[:ucaps:]](?:[[:ucaps:]\d]{1,}(?=\()|[[:ucaps:]\d]{2,}))(?:\((.*?)\))?(?=\W|$)/);
const reLink = re.compile(/^"(?!\s)((?:[^"]|"(?![\s:])[^\n"]+"(?!:))+)"[:txcite:]/);
const reLinkFenced = /^\["([^\n]+?)":((?:\[[a-z0-9]*\]|[^\]])+)\]/;
const reLinkTitle = /\s*\(((?:\([^()]*\)|[^()])+)\)$/;
const reFootnote = /^\[(\d+)(!?)\]/;

function parsePhrase (src, options) {
  src = ribbon(src);
  const list = builder();
  let m;
  let pba;

  // loop
  do {
    src.save();

    // linebreak -- having this first keeps it from messing to much with other phrases
    if (src.startsWith('\r\n')) {
      src.advance(1); // skip cartridge returns
    }
    if (src.startsWith('\n')) {
      src.advance(1);
      if (src.startsWith(' ')) {
        src.advance(1);
      }
      else if (options.breaks) {
        list.add([ 'br' ]);
      }
      list.add('\n');
      continue;
    }

    // inline notextile
    if ((m = /^==(.*?)==/.exec(src))) {
      src.advance(m[0]);
      list.add(m[1]);
      continue;
    }

    // lookbehind => /([\s>.,"'?!;:])$/
    const behind = src.lookbehind(1);
    const boundary = !behind || /^[\s<>.,"'?!;:()[\]%{}]$/.test(behind);
    // FIXME: need to test right boundary for phrases as well
    if ((m = rePhrase.exec(src)) && (boundary || m[1])) {
      src.advance(m[0]);
      const tok = m[2];
      const fence = m[1];
      const phraseType = phraseConvert[tok];
      const code = phraseType === 'code';

      if ((pba = !code && parseAttr(src, phraseType, tok))) {
        src.advance(pba[0]);
        pba = pba[1];
      }
      // FIXME: if we can't match the fence on the end, we should output fence-prefix as normal text
      // seek end
      let mMid;
      let mEnd;
      if (fence === '[') {
        mMid = '^(.*?)';
        mEnd = '(?:])';
      }
      else if (fence === '{') {
        mMid = '^(.*?)';
        mEnd = '(?:})';
      }
      else {
        const t1 = re.escape(tok.charAt(0));
        mMid = (code) ? '^(\\S+|\\S+.*?\\S)'
          : `^([^\\s${t1}]+|[^\\s${t1}].*?\\S(${t1}*))`;
        mEnd = '(?=$|[\\s.,"\'!?;:()«»„“”‚‘’<>])';
      }
      const rx = re.compile(`${mMid}(${re.escape(tok)})${mEnd}`);
      if ((m = rx.exec(src)) && m[1]) {
        src.advance(m[0]);
        if (code) {
          list.add([ phraseType, m[1] ]);
        }
        else {
          list.add([ phraseType, pba ].concat(parsePhrase(m[1], options)));
        }
        continue;
      }
      // else
      src.load();
    }

    // image
    if ((m = reImage.exec(src)) || (m = reImageFenced.exec(src))) {
      src.advance(m[0]);

      pba = m[1] && parseAttr(m[1], 'img');
      const attr = pba ? pba[1] : { src: '' };
      let img = [ 'img', attr ];
      attr.src = m[2];
      attr.alt = m[3] ? (attr.title = m[3]) : '';

      if (m[4]) { // +cite causes image to be wraped with a link (or link_ref)?
        // TODO: support link_ref for image cite
        img = [ 'a', { href: m[4] }, img ];
      }
      list.add(img);
      continue;
    }

    // html comment
    if ((m = testComment(src))) {
      src.advance(m[0]);
      list.add([ '!', m[1] ]);
      continue;
    }
    // html tag
    // TODO: this seems to have a lot of overlap with block tags... DRY?
    if ((m = testOpenTag(src))) {
      src.advance(m[0]);
      const tag = m[1];
      const single = m[3] || m[1] in singletons;
      let element = [ tag ];
      if (m[2]) {
        element.push(parseHtmlAttr(m[2]));
      }
      if (single) { // single tag
        list.add(element).add(src.skipWS());
        continue;
      }
      else { // need terminator
        // gulp up the rest of this block...
        const reEndTag = re.compile(`^(.*?)(</${tag}\\s*>)`, 's');
        if ((m = reEndTag.exec(src))) {
          src.advance(m[0]);
          if (tag === 'code') {
            element.push(m[1]);
          }
          else if (tag === 'notextile') {
            // HTML is still parsed, even though textile is not
            list.merge(parseHtml(tokenize(m[1])));
            continue;
          }
          else {
            element = element.concat(parsePhrase(m[1], options));
          }
          list.add(element);
          continue;
        }
        // end tag is missing, treat tag as normal text...
      }
      src.load();
    }

    // footnote
    if ((m = reFootnote.exec(src)) && /\S/.test(behind)) {
      src.advance(m[0]);
      list.add([ 'sup', { class: 'footnote', id: 'fnr' + m[1] },
        (m[2] === '!' ? m[1] // "!" suppresses the link
          : [ 'a', { href: '#fn' + m[1] }, m[1] ])
      ]);
      continue;
    }

    // caps / abbr
    if ((m = reCaps.exec(src))) {
      src.advance(m[0]);
      let caps = [ 'span', { class: 'caps' }, m[1] ];
      if (m[2]) {
        // FIXME: use <abbr>, not acronym!
        caps = [ 'acronym', { title: m[2] }, caps ];
      }
      list.add(caps);
      continue;
    }

    // links
    if ((boundary && (m = reLink.exec(src))) ||
                       (m = reLinkFenced.exec(src))) {
      src.advance(m[0]);
      let title = m[1].match(reLinkTitle);
      let inner = (title) ? m[1].slice(0, m[1].length - title[0].length) : m[1];
      if ((pba = parseAttr(inner, 'a'))) {
        inner = inner.slice(pba[0]);
        pba = pba[1];
      }
      else {
        pba = {};
      }
      if (title && !inner) {
        inner = title[0];
        title = '';
      }
      pba.href = m[2];
      if (title) { pba.title = title[1]; }
      // links may self-reference their url via $
      if (inner === '$') {
        inner = pba.href.replace(/^(https?:\/\/|ftps?:\/\/|mailto:)/, '');
      }
      list.add([ 'a', pba ].concat(parsePhrase(inner.replace(/^(\.?\s*)/, ''), options)));
      continue;
    }

    // no match, move by all "uninteresting" chars
    m = /([a-zA-Z0-9,.':]+|[ \f\r\t\v\xA0\u2028\u2029]+|[^\0])/.exec(src);
    if (m) {
      list.add(m[0]);
    }
    src.advance(m ? m[0].length || 1 : 1);
  }
  while (src.valueOf());

  return list.get().map(parseGlyph);
}

exports.parsePhrase = parsePhrase;
