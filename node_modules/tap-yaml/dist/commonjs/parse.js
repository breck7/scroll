"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const yaml_1 = __importDefault(require("yaml"));
const index_js_1 = require("./types/index.js");
const parse = (str) => yaml_1.default.parse(str, { customTags: index_js_1.customTags, prettyErrors: true });
exports.parse = parse;
//# sourceMappingURL=parse.js.map