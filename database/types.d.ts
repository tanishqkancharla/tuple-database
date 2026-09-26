import { MAX, MIN, Tuple } from "../storage/types";
import { RemoveTuplePrefix, TuplePrefix } from "./typeHelpers";
export type ScanArgs<T extends Tuple, P extends TuplePrefix<T>> = PrefixScanArgs<T, P>;
export type PrefixScanArgs<T extends Tuple, P extends TuplePrefix<T>> = {
    prefix?: P;
    gt?: AllowMinMax<TuplePrefix<RemoveTuplePrefix<T, P>>>;
    gte?: AllowMinMax<TuplePrefix<RemoveTuplePrefix<T, P>>>;
    lt?: AllowMinMax<TuplePrefix<RemoveTuplePrefix<T, P>>>;
    lte?: AllowMinMax<TuplePrefix<RemoveTuplePrefix<T, P>>>;
    limit?: number;
    reverse?: boolean;
};
type AllowMinMax<T extends Tuple> = {
    [K in keyof T]: T[K] | typeof MIN | typeof MAX;
};
export type TxId = string;
export type Unsubscribe = () => void;
export type RngApi = {
    randomId: () => string;
};
export type TupleDatabaseOptions = {
    /** Source of listener and fallback transaction ids. Defaults to random UUIDs. */
    rng?: RngApi;
};
export {};
//# sourceMappingURL=../../src/database/types.d.ts.map