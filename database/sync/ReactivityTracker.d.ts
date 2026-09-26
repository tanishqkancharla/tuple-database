import { ScanStorageArgs, WriteOps } from "../../storage/types";
import { RngApi, TxId } from "../types";
import { Callback } from "./types";
export declare class ReactivityTracker {
    private rng;
    private listenersDb;
    constructor(rng?: RngApi);
    subscribe(args: ScanStorageArgs, callback: Callback): () => void;
    computeReactivityEmits(writes: WriteOps): ReactivityEmits;
    emit(emits: ReactivityEmits, txId: TxId): any;
}
type ReactivityEmits = Map<Callback, Required<WriteOps>>;
export {};
//# sourceMappingURL=../../../src/database/sync/ReactivityTracker.d.ts.map