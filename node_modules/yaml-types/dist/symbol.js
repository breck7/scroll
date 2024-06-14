"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.symbol = exports.sharedSymbol = void 0;
const util_1 = require("yaml/util");
exports.sharedSymbol = {
    identify: value => value?.constructor === Symbol && typeof Symbol.keyFor(value) === 'string',
    tag: '!symbol/shared',
    resolve: str => Symbol.for(str),
    stringify(item, ctx, onComment, onChompKeep) {
        const key = Symbol.keyFor(item.value);
        if (key === undefined) {
            throw new TypeError('Only shared symbols are supported');
        }
        return (0, util_1.stringifyString)({ value: key }, ctx, onComment, onChompKeep);
    }
};
exports.symbol = {
    identify: value => value?.constructor === Symbol && Symbol.keyFor(value) === undefined,
    tag: '!symbol',
    resolve: str => Symbol(str),
    stringify(item, ctx, onComment, onChompKeep) {
        const sym = item.value;
        if (typeof sym !== 'symbol')
            throw new TypeError(`${sym} is not a symbol`);
        const value = String(sym).replace(/^Symbol\(|\)$/g, '');
        return (0, util_1.stringifyString)({ value }, ctx, onComment, onChompKeep);
    }
};
//# sourceMappingURL=symbol.js.map