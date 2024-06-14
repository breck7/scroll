/* textile glyph parser */

const re = require('../re');

const reApostrophe = /(\w)'(\w)/g;
const reArrow = /([^-]|^)->/;
const reClosingDQuote = re.compile(/([^\s[(])"(?=$|\s|[:punct:])/g);
const reClosingSQuote = re.compile(/([^\s[(])'(?=$|\s|[:punct:])/g);
const reCopyright = /(\b ?|\s|^)(?:\(C\)|\[C\])/gi;
const reDimsign = /([\d.,]+['"]? ?)x( ?)(?=[\d.,]['"]?)/g;
const reDoublePrime = re.compile(/(\d*[.,]?\d+)"(?=\s|$|[:punct:])/g);
const reEllipsis = /([^.]?)\.{3}/g;
const reEmdash = /(^|[\s\w])--([\s\w]|$)/g;
const reEndash = / - /g;
const reOpenDQuote = /"/g;
const reOpenSQuote = /'/g;
const reRegistered = /(\b ?|\s|^)(?:\(R\)|\[R\])/gi;
const reSinglePrime = re.compile(/(\d*[.,]?\d+)'(?=\s|$|[:punct:])/g);
const reTrademark = /(\b ?|\s|^)(?:\((?:TM|tm)\)|\[(?:TM|tm)\])/g;

exports.parseGlyph = function parseGlyph (src) {
  if (typeof src !== 'string') {
    return src;
  }
  // NB: order is important here ...
  return src
    .replace(reArrow, '$1&#8594;')
    .replace(reDimsign, '$1&#215;$2')
    .replace(reEllipsis, '$1&#8230;')
    .replace(reEmdash, '$1&#8212;$2')
    .replace(reEndash, ' &#8211; ')
    .replace(reTrademark, '$1&#8482;')
    .replace(reRegistered, '$1&#174;')
    .replace(reCopyright, '$1&#169;')
    // double quotes
    .replace(reDoublePrime, '$1&#8243;')
    .replace(reClosingDQuote, '$1&#8221;')
    .replace(reOpenDQuote, '&#8220;')
    // single quotes
    .replace(reSinglePrime, '$1&#8242;')
    .replace(reApostrophe, '$1&#8217;$2')
    .replace(reClosingSQuote, '$1&#8217;')
    .replace(reOpenSQuote, '&#8216;')
    // fractions and degrees
    .replace(/[([]1\/4[\])]/, '&#188;')
    .replace(/[([]1\/2[\])]/, '&#189;')
    .replace(/[([]3\/4[\])]/, '&#190;')
    .replace(/[([]o[\])]/, '&#176;')
    .replace(/[([]\+\/-[\])]/, '&#177;');
};
