"use strict";
// This codec is should create a component-wise lexicographically sortable array.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeTuple = exports.encodeTuple = exports.decodeValue = exports.encodingTypeOf = exports.encodeValue = exports.encodingRank = exports.encodingByte = void 0;
const elen = __importStar(require("elen"));
const lodash_1 = require("lodash");
const compare_1 = require("./compare");
const Unreachable_1 = require("./Unreachable");
const defaultOptions = {
    delimiter: "\x00",
    escape: "\x01",
    disallow: [],
};
// null < object < array < number < string < boolean
exports.encodingByte = {
    null: "b",
    object: "c",
    array: "d",
    number: "e",
    string: "f",
    boolean: "g",
};
exports.encodingRank = (0, lodash_1.sortBy)(Object.entries(exports.encodingByte), ([_key, value]) => value).map(([key]) => key);
function encodeValue(value, options) {
    var _a;
    if (value === null) {
        return exports.encodingByte.null;
    }
    if (value === true || value === false) {
        return exports.encodingByte.boolean + value;
    }
    if (typeof value === "string") {
        for (const disallowed of (_a = options === null || options === void 0 ? void 0 : options.disallow) !== null && _a !== void 0 ? _a : defaultOptions.disallow) {
            if (value.includes(disallowed)) {
                throw new Error(`Disallowed character found: ${disallowed}.`);
            }
        }
        return exports.encodingByte.string + value;
    }
    if (typeof value === "number") {
        return exports.encodingByte.number + elen.encode(value);
    }
    if (Array.isArray(value)) {
        return exports.encodingByte.array + encodeTuple(value, options);
    }
    if (typeof value === "object") {
        return exports.encodingByte.object + encodeObjectValue(value, options);
    }
    throw new Unreachable_1.UnreachableError(value, "Unknown value type");
}
exports.encodeValue = encodeValue;
function encodingTypeOf(value) {
    if (value === null) {
        return "null";
    }
    if (value === true || value === false) {
        return "boolean";
    }
    if (typeof value === "string") {
        return "string";
    }
    if (typeof value === "number") {
        return "number";
    }
    if (Array.isArray(value)) {
        return "array";
    }
    if (typeof value === "object") {
        return "object";
    }
    throw new Unreachable_1.UnreachableError(value, "Unknown value type");
}
exports.encodingTypeOf = encodingTypeOf;
const decodeType = (0, lodash_1.invert)(exports.encodingByte);
function decodeValue(str, options) {
    const encoding = decodeType[str[0]];
    const rest = str.slice(1);
    if (encoding === "null") {
        return null;
    }
    if (encoding === "boolean") {
        return JSON.parse(rest);
    }
    if (encoding === "string") {
        return rest;
    }
    if (encoding === "number") {
        return elen.decode(rest);
    }
    if (encoding === "array") {
        return decodeTuple(rest, options);
    }
    if (encoding === "object") {
        return decodeObjectValue(rest, options);
    }
    throw new Unreachable_1.UnreachableError(encoding, "Invalid encoding byte");
}
exports.decodeValue = decodeValue;
function encodeTuple(tuple, options) {
    var _a, _b;
    const delimiter = (_a = options === null || options === void 0 ? void 0 : options.delimiter) !== null && _a !== void 0 ? _a : defaultOptions.delimiter;
    const escape = (_b = options === null || options === void 0 ? void 0 : options.escape) !== null && _b !== void 0 ? _b : defaultOptions.escape;
    const reEscapeByte = new RegExp(escape, "g");
    const reDelimiterByte = new RegExp(delimiter, "g");
    return tuple
        .map((value, i) => {
        const encoded = encodeValue(value, options);
        return (encoded
            // B -> BB or \ -> \\
            .replace(reEscapeByte, escape + escape)
            // A -> BA or x -> \x
            .replace(reDelimiterByte, escape + delimiter) + delimiter);
    })
        .join("");
}
exports.encodeTuple = encodeTuple;
function decodeTuple(str, options) {
    var _a, _b;
    if (str === "") {
        return [];
    }
    const delimiter = (_a = options === null || options === void 0 ? void 0 : options.delimiter) !== null && _a !== void 0 ? _a : defaultOptions.delimiter;
    const escape = (_b = options === null || options === void 0 ? void 0 : options.escape) !== null && _b !== void 0 ? _b : defaultOptions.escape;
    // Capture all of the escaped BB and BA pairs and wait
    // til we find an exposed A.
    const matcher = new RegExp(`(${escape}(${escape}|${delimiter})|${delimiter})`, "g");
    const reEncodedEscape = new RegExp(escape + escape, "g");
    const reEncodedDelimiter = new RegExp(escape + delimiter, "g");
    const tuple = [];
    let start = 0;
    while (true) {
        const match = matcher.exec(str);
        if (match === null) {
            return tuple;
        }
        if (match[0][0] === escape) {
            // If we match a escape+escape or escape+delimiter then keep going.
            continue;
        }
        const end = match.index;
        const escaped = str.slice(start, end);
        const unescaped = escaped
            // BB -> B
            .replace(reEncodedEscape, escape)
            // BA -> A
            .replace(reEncodedDelimiter, delimiter);
        const decoded = decodeValue(unescaped, options);
        tuple.push(decoded);
        // Skip over the \x00.
        start = end + 1;
    }
}
exports.decodeTuple = decodeTuple;
function encodeObjectValue(obj, options) {
    if (!(0, lodash_1.isPlainObject)(obj)) {
        throw new Error("Cannot serialize this object.");
    }
    const entries = Object.entries(obj)
        .sort(([k1], [k2]) => (0, compare_1.compare)(k1, k2))
        // We allow undefined values in objects, but we want to strip them out before
        // serializing.
        .filter(([key, value]) => value !== undefined);
    return encodeTuple(entries, options);
}
function decodeObjectValue(str, options) {
    const entries = decodeTuple(str, options);
    const obj = {};
    for (const [key, value] of entries) {
        obj[key] = value;
    }
    return obj;
}
//# sourceMappingURL=../../src/helpers/codec.js.map