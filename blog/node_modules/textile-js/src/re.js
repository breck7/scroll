/*
** Regular Expression helper methods
**
** This provides the `re` object, which contains several helper
** methods for working with big regular expressions (soup).
**
*/

const _cache = {};

const re = module.exports = {

  pattern: {
    punct: '[!-/:-@\\[\\\\\\]-`{-~]',
    space: '\\s'
  },

  escape: function (src) {
    return src.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  },

  collapse: function (src) {
    return src.replace(/(?:#.*?(?:\n|$))/g, '')
      .replace(/\s+/g, '');
  },

  expandPatterns: function (src) {
    // TODO: provide escape for patterns: \[:pattern:] ?
    return src.replace(/\[:\s*(\w+)\s*:\]/g, function (m, k) {
      const ex = re.pattern[k];
      if (ex) {
        return re.expandPatterns(ex);
      }
      else {
        throw new Error('Pattern ' + m + ' not found in ' + src);
      }
    });
  },

  isRegExp: function (r) {
    return Object.prototype.toString.call(r) === '[object RegExp]';
  },

  compile: function (src, flags) {
    if (re.isRegExp(src)) {
      if (arguments.length === 1) { // no flags arg provided, use the RegExp one
        flags = (src.global ? 'g' : '') +
                (src.ignoreCase ? 'i' : '') +
                (src.multiline ? 'm' : '');
      }
      src = src.source;
    }
    // don't do the same thing twice
    const ckey = src + (flags || '');
    if (ckey in _cache) {
      return _cache[ckey];
    }
    // allow classes
    let rx = re.expandPatterns(src);
    // allow verbose expressions
    if (flags && /x/.test(flags)) {
      rx = re.collapse(rx);
    }
    // allow dotall expressions
    if (flags && /s/.test(flags)) {
      rx = rx.replace(/([^\\])\./g, '$1[^\\0]');
    }
    // TODO: test if MSIE and add replace \s with [\s\u00a0] if it is?
    // clean flags and output new regexp
    flags = (flags || '').replace(/[^gim]/g, '');
    return (_cache[ckey] = new RegExp(rx, flags));
  }

};
