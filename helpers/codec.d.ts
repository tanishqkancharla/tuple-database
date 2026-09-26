import { Tuple, Value } from "../storage/types";
export type CodecOptions = {
    /**
     * The delimiter between values in a tuple.
     * @default "\x00"
     */
    delimiter?: string;
    /**
     * The escape byte.
     * @default "\x01"
     */
    escape?: string;
    /**
     * Disallowed characters in strings. Throws an error if any are found while encoding.
     */
    disallow?: string[];
};
export declare const encodingByte: {
    readonly null: "b";
    readonly object: "c";
    readonly array: "d";
    readonly number: "e";
    readonly string: "f";
    readonly boolean: "g";
};
export type EncodingType = keyof typeof encodingByte;
export declare const encodingRank: ("string" | "number" | "boolean" | "object" | "null" | "array")[];
export declare function encodeValue(value: Value, options?: CodecOptions): string;
export declare function encodingTypeOf(value: Value): EncodingType;
export declare function decodeValue(str: string, options?: CodecOptions): Value;
export declare function encodeTuple(tuple: Tuple, options?: CodecOptions): string;
export declare function decodeTuple(str: string, options?: CodecOptions): Tuple;
//# sourceMappingURL=../../src/helpers/codec.d.ts.map