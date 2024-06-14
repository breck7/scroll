"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringify = exports.parse = void 0;
const parse_js_1 = require("./parse.js");
Object.defineProperty(exports, "parse", { enumerable: true, get: function () { return parse_js_1.parse; } });
const stringify_js_1 = require("./stringify.js");
Object.defineProperty(exports, "stringify", { enumerable: true, get: function () { return stringify_js_1.stringify; } });
exports.default = { parse: parse_js_1.parse, stringify: stringify_js_1.stringify };
//# sourceMappingURL=index.js.map