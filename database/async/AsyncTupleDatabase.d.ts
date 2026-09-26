import { KeyValuePair, ScanStorageArgs, WriteOps } from "../../storage/types";
import { ConcurrencyLog } from "../ConcurrencyLog";
import { TupleStorageApi } from "../sync/types";
import { TupleDatabaseOptions, TxId, Unsubscribe } from "../types";
import { AsyncReactivityTracker } from "./AsyncReactivityTracker";
import { AsyncCallback, AsyncTupleDatabaseApi, AsyncTupleStorageApi } from "./asyncTypes";
export declare class AsyncTupleDatabase implements AsyncTupleDatabaseApi {
    private storage;
    private rng;
    log: ConcurrencyLog;
    reactivity: AsyncReactivityTracker;
    constructor(storage: TupleStorageApi | AsyncTupleStorageApi, options?: TupleDatabaseOptions);
    scan(args?: ScanStorageArgs, txId?: TxId): Promise<KeyValuePair[]>;
    subscribe(args: ScanStorageArgs, callback: AsyncCallback): Promise<Unsubscribe>;
    commit(writes: WriteOps, txId?: string): Promise<any>;
    cancel(txId: string): Promise<void>;
    close(): Promise<void>;
}
//# sourceMappingURL=../../../src/database/async/AsyncTupleDatabase.d.ts.map