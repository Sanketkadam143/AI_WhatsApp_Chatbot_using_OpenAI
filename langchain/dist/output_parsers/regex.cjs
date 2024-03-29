"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegexParser = void 0;
const output_parser_js_1 = require("../schema/output_parser.cjs");
/**
 * Class to parse the output of an LLM call into a dictionary.
 * @augments BaseOutputParser
 */
class RegexParser extends output_parser_js_1.BaseOutputParser {
    constructor(regex, outputKeys, defaultOutputKey) {
        super(...arguments);
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "output_parsers", "regex"]
        });
        Object.defineProperty(this, "regex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "outputKeys", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "defaultOutputKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.regex = typeof regex === "string" ? new RegExp(regex) : regex;
        this.outputKeys = outputKeys;
        this.defaultOutputKey = defaultOutputKey;
    }
    _type() {
        return "regex_parser";
    }
    async parse(text) {
        const match = text.match(this.regex);
        if (match) {
            return this.outputKeys.reduce((acc, key, index) => {
                acc[key] = match[index + 1];
                return acc;
            }, {});
        }
        if (this.defaultOutputKey === undefined) {
            throw new output_parser_js_1.OutputParserException(`Could not parse output: ${text}`, text);
        }
        return this.outputKeys.reduce((acc, key) => {
            acc[key] = key === this.defaultOutputKey ? text : "";
            return acc;
        }, {});
    }
    getFormatInstructions() {
        return `Your response should match the following regex: ${this.regex}`;
    }
}
exports.RegexParser = RegexParser;
