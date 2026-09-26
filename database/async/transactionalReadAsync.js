"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionalReadAsync = void 0;
const retry_1 = require("../retry");
/**
 * Similar to transactionalReadWrite and transactionalWrite but only allows reads.
 */
function transactionalReadAsync(retries = 5) {
    return function (fn) {
        return function (dbOrTx, ...args) {
            if (!("transact" in dbOrTx))
                return fn(dbOrTx, ...args);
            return (0, retry_1.retry)(retries, () => {
                const tx = dbOrTx.transact();
                const result = fn(tx, ...args);
                tx.commit();
                return result;
            });
        };
    };
}
exports.transactionalReadAsync = transactionalReadAsync;
//# sourceMappingURL=../../../src/database/async/transactionalReadAsync.js.map