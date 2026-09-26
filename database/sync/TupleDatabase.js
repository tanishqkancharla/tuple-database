"use strict";
/*

This file is generated from async/AsyncTupleDatabase.ts

*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.TupleDatabase = void 0;
const iterateTuples_1 = require("../../helpers/iterateTuples");
const randomId_1 = require("../../helpers/randomId");
const ConcurrencyLog_1 = require("../ConcurrencyLog");
const ReactivityTracker_1 = require("./ReactivityTracker");
class TupleDatabase {
    constructor(storage, options = {}) {
        var _a;
        this.storage = storage;
        this.log = new ConcurrencyLog_1.ConcurrencyLog();
        this.rng = (_a = options.rng) !== null && _a !== void 0 ? _a : randomId_1.defaultRng;
        this.reactivity = new ReactivityTracker_1.ReactivityTracker(this.rng);
    }
    scan(args = {}, txId) {
        const { reverse, limit, ...bounds } = args;
        if (txId)
            this.log.read(txId, bounds);
        return this.storage.scan({ ...bounds, reverse, limit });
    }
    subscribe(args, callback) {
        return this.reactivity.subscribe(args, callback);
    }
    commit(writes, txId) {
        // Note: commit is called for transactional reads as well!
        const emits = this.reactivity.computeReactivityEmits(writes);
        if (txId)
            this.log.commit(txId);
        for (const tuple of (0, iterateTuples_1.iterateWrittenTuples)(writes)) {
            this.log.write(txId, tuple);
        }
        this.storage.commit(writes);
        return this.reactivity.emit(emits, txId || this.rng.randomId());
    }
    cancel(txId) {
        this.log.cancel(txId);
    }
    close() {
        this.storage.close();
    }
}
exports.TupleDatabase = TupleDatabase;
//# sourceMappingURL=../../../src/database/sync/TupleDatabase.js.map