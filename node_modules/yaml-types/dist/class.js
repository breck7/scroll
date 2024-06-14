"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classTag = void 0;
const util_1 = require("yaml/util");
const options = {
    defaultType: 'BLOCK_LITERAL'
};
/**
 * `!class` A YAML representation of JavaScript classes
 *
 * Stringified as a block literal string, prefixed with the class name.
 *
 * When parsing, a no-op class with matching name and toString() is
 * returned. It is not possible to construct an actual JavaScript class by
 * evaluating YAML, and it is unsafe to attempt.
 */
exports.classTag = {
    identify(value) {
        const cls = value;
        try {
            return typeof value === 'function' && Boolean(class extends cls {
            });
        }
        catch {
            return false;
        }
    },
    tag: '!class',
    resolve(str) {
        const f = class {
        };
        f.toString = () => str;
        const m = str.trim().match(/^class(?:\s+([^{ \s]*?)[{\s])/);
        Object.defineProperty(f, 'name', {
            value: m?.[1],
            enumerable: false,
            configurable: true,
            writable: true
        });
        return f;
    },
    options,
    stringify(i, ctx, onComment, onChompKeep) {
        const { type: originalType, value: originalValue } = i;
        const cls = originalValue;
        const value = cls.toString();
        // better to just always put classes on a new line.
        const type = originalType || options.defaultType;
        return (0, util_1.stringifyString)({ ...i, type, value }, ctx, onComment, onChompKeep);
    }
};
//# sourceMappingURL=class.js.map