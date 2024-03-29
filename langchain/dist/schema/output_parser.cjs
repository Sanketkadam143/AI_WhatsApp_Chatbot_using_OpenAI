"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputParserException = exports.BaseOutputParser = void 0;
const serializable_js_1 = require("../load/serializable.cjs");
/** Class to parse the output of an LLM call.
 */
class BaseOutputParser extends serializable_js_1.Serializable {
    async parseWithPrompt(text, _prompt, callbacks) {
        return this.parse(text, callbacks);
    }
    /**
     * Return the string type key uniquely identifying this class of parser
     */
    _type() {
        throw new Error("_type not implemented");
    }
}
exports.BaseOutputParser = BaseOutputParser;
class OutputParserException extends Error {
    constructor(message, output) {
        super(message);
        Object.defineProperty(this, "output", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.output = output;
    }
}
exports.OutputParserException = OutputParserException;
