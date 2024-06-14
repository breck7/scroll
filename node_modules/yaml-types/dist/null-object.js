"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nullobject = void 0;
const yaml_1 = require("yaml");
const tag = '!nullobject';
class YAMLNullObject extends yaml_1.YAMLMap {
    constructor() {
        super(...arguments);
        this.tag = tag;
    }
    toJSON(_, ctx) {
        const obj = super.toJSON(_, { ...ctx, mapAsMap: false });
        return Object.assign(Object.create(null), obj);
    }
}
/**
 * `!nullobject` An object with a `null` prototype
 */
exports.nullobject = {
    tag,
    collection: 'map',
    nodeClass: YAMLNullObject,
    identify: v => !!(typeof v === 'object' && v && !Object.getPrototypeOf(v))
};
//# sourceMappingURL=null-object.js.map