import { strict as assert } from "assert"
import { describe, it } from "mocha"
import { InMemoryTupleStorage } from "../storage/InMemoryTupleStorage"
import { MAX, MIN, ScanStorageArgs } from "../storage/types"
import { AsyncTupleDatabase } from "./async/AsyncTupleDatabase"
import { TupleDatabase } from "./sync/TupleDatabase"
import { RngApi } from "./types"

const todos: ScanStorageArgs = { gt: ["todos", MIN], lt: ["todos", MAX] }

function sequenceRng(ids: string[]): RngApi {
	let index = 0
	return { randomId: () => ids[index++] }
}

describe("TupleDatabase rng option", () => {
	it("orders listeners on the same prefix by the ids the rng returns", () => {
		const db = new TupleDatabase(new InMemoryTupleStorage(), {
			rng: sequenceRng(["b", "a", "tx"]),
		})
		const calls: string[] = []
		db.subscribe(todos, () => {
			calls.push("first")
		})
		db.subscribe(todos, () => {
			calls.push("second")
		})

		db.commit({ set: [{ key: ["todos", 1], value: null }] })

		assert.deepEqual(calls, ["second", "first"])
	})

	it("uses the rng for a commit made without a transaction id", () => {
		const db = new TupleDatabase(new InMemoryTupleStorage(), {
			rng: sequenceRng(["listener", "tx-1"]),
		})
		const txIds: string[] = []
		db.subscribe(todos, (_writes, txId) => {
			txIds.push(txId)
		})

		db.commit({ set: [{ key: ["todos", 1], value: null }] })

		assert.deepEqual(txIds, ["tx-1"])
	})

	it("threads the rng through the async database", async () => {
		const db = new AsyncTupleDatabase(new InMemoryTupleStorage(), {
			rng: sequenceRng(["b", "a", "tx-1"]),
		})
		const calls: string[] = []
		await db.subscribe(todos, (_writes, txId) => {
			calls.push(`first:${txId}`)
		})
		await db.subscribe(todos, (_writes, txId) => {
			calls.push(`second:${txId}`)
		})

		await db.commit({ set: [{ key: ["todos", 1], value: null }] })

		assert.deepEqual(calls, ["second:tx-1", "first:tx-1"])
	})
})
