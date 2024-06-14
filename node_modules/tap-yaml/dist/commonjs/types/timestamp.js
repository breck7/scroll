"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timestamp = void 0;
// this just sets the !!timestamp tag to be not considered a default,
// so that we don't confuse date strings and actual dates.
// See: https://github.com/eemeli/yaml/issues/475
const yaml_1 = require("yaml");
const schema = new yaml_1.Schema({ resolveKnownTags: true });
exports.timestamp = schema.knownTags['tag:yaml.org,2002:timestamp'];
exports.timestamp.default = false;
//# sourceMappingURL=timestamp.js.map