/* textile list parser */
const ribbon = require('../ribbon');
const re = require('../re');
const merge = require('../merge');

const { parseAttr } = require('./attr');
const { parsePhrase } = require('./phrase');

const { txlisthd, txlisthd2 } = require('./re_ext');
re.pattern.txlisthd = txlisthd;
re.pattern.txlisthd2 = txlisthd2;
const reList = re.compile(/^((?:[:txlisthd:][^\0]*?(?:\r?\n|$))+)(\s*\n|$)/, 's');
const reItem = re.compile(/^([#*]+)([^\0]+?)(\n(?=[:txlisthd2:])|$)/, 's');

function listPad (n) {
  let s = '\n';
  while (n--) {
    s += '\t';
  }
  return s;
}

function testList (src) {
  return reList.exec(src);
}

function parseList (src, options) {
  src = ribbon(src.replace(/(^|\r?\n)[\t ]+/, '$1'));

  const stack = [];
  const currIndex = {};
  const lastIndex = options._lst || {};
  let itemIndex = 0;
  let listAttr;
  let m;
  let n;
  let s;

  while ((m = reItem.exec(src))) {
    const item = [ 'li' ];
    const destLevel = m[1].length;
    const type = (m[1].substr(-1) === '#') ? 'ol' : 'ul';
    let newLi = null;
    let lst;
    let par;
    let pba;
    let r;

    // list starts and continuations
    if ((n = /^(_|\d+)/.exec(m[2]))) {
      itemIndex = isFinite(n[1])
        ? parseInt(n[1], 10)
        : lastIndex[destLevel] || currIndex[destLevel] || 1;
      m[2] = m[2].slice(n[1].length);
    }

    if ((pba = parseAttr(m[2], 'li'))) {
      m[2] = m[2].slice(pba[0]);
      pba = pba[1];
    }

    // list control
    if (/^\.\s*$/.test(m[2])) {
      listAttr = pba || {};
      src.advance(m[0]);
      continue;
    }

    // create nesting until we have correct level
    while (stack.length < destLevel) {
      // list always has an attribute object, this simplifies first-pba resolution
      lst = [ type, {}, listPad(stack.length + 1), (newLi = [ 'li' ]) ];
      par = stack[stack.length - 1];
      if (par) {
        par.li.push(listPad(stack.length));
        par.li.push(lst);
      }
      stack.push({
        ul: lst,
        li: newLi,
        // count attributes's found per list
        att: 0
      });
      currIndex[stack.length] = 1;
    }

    // remove nesting until we have correct level
    while (stack.length > destLevel) {
      r = stack.pop();
      r.ul.push(listPad(stack.length));
      // lists have a predictable structure - move pba from listitem to list
      if (r.att === 1 && !r.ul[3][1].substr) {
        merge(r.ul[1], r.ul[3].splice(1, 1)[0]);
      }
    }

    // parent list
    par = stack[stack.length - 1];

    if (itemIndex) {
      par.ul[1].start = itemIndex;
      currIndex[destLevel] = itemIndex;
      // falsy prevents this from fireing until it is set again
      itemIndex = 0;
    }
    if (listAttr) {
      // "more than 1" prevent attribute transfers on list close
      par.att = 9;
      merge(par.ul[1], listAttr);
      listAttr = null;
    }

    if (!newLi) {
      par.ul.push(listPad(stack.length), item);
      par.li = item;
    }
    if (pba) {
      par.li.push(pba);
      par.att++;
    }
    Array.prototype.push.apply(par.li, parsePhrase(m[2].trim(), options));

    src.advance(m[0]);
    currIndex[destLevel] = (currIndex[destLevel] || 0) + 1;
  }

  // remember indexes for continuations next time
  options._lst = currIndex;

  while (stack.length) {
    s = stack.pop();
    s.ul.push(listPad(stack.length));
    // lists have a predictable structure - move pba from listitem to list
    if (s.att === 1 && !s.ul[3][1].substr) {
      merge(s.ul[1], s.ul[3].splice(1, 1)[0]);
    }
  }

  return s.ul;
}

module.exports = {
  testList: testList,
  parseList: parseList
};
