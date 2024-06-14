"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = void 0;
const yaml_1 = require("yaml");
const tag = '!error';
// If the user cared to provide a custom inspect, then use
// that as the source of extra properties.
const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom');
class YAMLErrorObject extends yaml_1.YAMLMap {
    constructor() {
        super(...arguments);
        this.tag = tag;
    }
    toJSON(_, ctx) {
        ctx = { ...ctx, mapAsMap: false };
        // stack has to be handled separately, because JS will create
        // a random stack trace at this callsite, which we don't want.
        // If the YAML doesn't have a stack defined, this will end up setting
        // it to `undefined` explicitly. Otherwise, it'll be whatever's in
        // the YAML.
        const { name, message, stack, ...rest } = super.toJSON(_, ctx);
        const Cls = name === 'EvalError'
            ? EvalError
            : name === 'RangeError'
                ? RangeError
                : name === 'ReferenceError'
                    ? ReferenceError
                    : name === 'SyntaxError'
                        ? SyntaxError
                        : name === 'TypeError'
                            ? TypeError
                            : name === 'URIError'
                                ? URIError
                                : Error;
        const er = new Cls(message);
        if (Cls.name !== name) {
            Object.defineProperty(er, 'name', {
                value: name,
                enumerable: false,
                configurable: true
            });
        }
        er.stack = stack;
        return Object.assign(er, rest);
    }
    static from(schema, value, ctx) {
        // Error.cause is standardized, but only recently, so TS does not
        // yet recognize it as a property on the Error type. It's non-enumerable,
        // and like stack, very useful to retain in diagnostic information.
        const error = value;
        const { name, message, stack, cause } = error;
        const maybeCustom = error;
        let fields = typeof maybeCustom[customInspectSymbol] === 'function' &&
            maybeCustom[customInspectSymbol]();
        fields || (fields = typeof maybeCustom.toJSON === 'function' && maybeCustom.toJSON());
        fields || (fields = { ...error });
        const withCause = cause === undefined ? {} : { cause };
        // delete the noisy fields that Node.js injects when domains are active
        delete fields.domain;
        delete fields.domainEmitter;
        delete fields.domainThrew;
        return super.from(schema, {
            name,
            message,
            stack,
            ...withCause,
            ...fields
        }, ctx);
    }
}
/**
 * `!error` Error object values
 *
 * An object collection of all enumerable properties on the Error object,
 * along with stack, message, and name (which are typically non-enumerable).
 *
 * If the Error has a `Symbol.for('util.inspect.custom')` or `toJSON` method,
 * then this will be called to get the object properties.
 *
 * When parsing, though the `stack` string is maintained, the internal call
 * site information will of course not be preserved faithfully.
 */
exports.error = {
    tag,
    collection: 'map',
    nodeClass: YAMLErrorObject,
    identify: (er) => er instanceof Error
};
//# sourceMappingURL=error.js.map