"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bigint = void 0;
const util_1 = require("yaml/util");
/**
 * `!bigint` BigInt
 *
 * [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) values,
 * using their conventional `123n` representation.
 */
exports.bigint = {
    identify: (value) => {
        return typeof value === 'bigint' || value instanceof BigInt;
    },
    tag: '!bigint',
    resolve(str) {
        if (str.endsWith('n'))
            str = str.substring(0, str.length - 1);
        return BigInt(str);
    },
    stringify(item, ctx, onComment, onChompKeep) {
        if (!exports.bigint.identify?.(item.value)) {
            throw new TypeError(`${item.value} is not a bigint`);
        }
        const value = item.value.toString() + 'n';
        return (0, util_1.stringifyString)({ value }, ctx, onComment, onChompKeep);
    }
};
//# sourceMappingURL=bigint.js.map