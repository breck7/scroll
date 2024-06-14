module.exports = function ribbon (feed) {
  const org = String(feed);
  let slot;
  let pos = 0;
  const self = {

    index: () => {
      return pos;
    },

    save: () => {
      slot = pos;
      return self;
    },

    load: () => {
      pos = slot;
      feed = org.slice(pos);
      return self;
    },

    advance: n => {
      pos += (typeof n === 'string') ? n.length : n;
      feed = org.slice(pos);
      return feed;
    },

    skipWS: () => {
      const ws = /^\s+/.exec(feed);
      if (ws) {
        pos += ws[0].length;
        feed = org.slice(pos);
        return ws[0];
      }
      return '';
    },

    lookbehind: nchars => {
      nchars = nchars == null ? 1 : nchars;
      return org.slice(pos - nchars, pos);
    },

    startsWith: s => {
      return feed.substring(0, s.length) === s;
    },

    slice: (a, b) => {
      return b != null ? feed.slice(a, b) : feed.slice(a);
    },

    valueOf: () => {
      return feed;
    },

    toString: () => {
      return feed;
    }

  };

  return self;
};
