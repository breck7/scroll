module.exports = function builder (initArr) {
  const arr = Array.isArray(initArr) ? initArr : [];

  return {
    add: function (node) {
      if (typeof node === 'string' &&
           typeof arr[arr.length - 1] === 'string') {
        // join if possible
        arr[arr.length - 1] += node;
      }
      else if (Array.isArray(node)) {
        arr.push(node.filter(s => s !== undefined));
      }
      else if (node) {
        arr.push(node);
      }
      return this;
    },

    merge: function (arr) {
      for (let i = 0, l = arr.length; i < l; i++) {
        this.add(arr[i]);
      }
      return this;
    },

    linebreak: function () {
      if (arr.length) {
        this.add('\n');
      }
    },

    get: function () {
      return arr;
    }
  };
};
