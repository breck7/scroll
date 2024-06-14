"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.regexp = void 0;
/**
 * `!re` RegExp
 *
 * [Regular Expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions) values,
 * using their default `/foo/flags` string representation.
 */
exports.regexp = {
    identify: value => value instanceof RegExp,
    tag: '!re',
    resolve(str) {
        const match = str.match(/^\/([\s\S]+)\/([dgimsuy]*)$/);
        if (!match)
            throw new Error('Invalid RegExp value');
        return new RegExp(match[1], match[2]);
    }
};
//# sourceMappingURL=regexp.js.map