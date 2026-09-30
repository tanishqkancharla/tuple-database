import { describe, it } from "mocha"
import { InMemoryTupleStorage } from "../../storage/InMemoryTupleStorage"
import { assertEqual } from "../../test/assertHelpers"
import { AsyncTupleDatabase } from "./AsyncTupleDatabase"
import { AsyncTupleDatabaseClient } from "./AsyncTupleDatabaseClient"
import { subscribeQueryAsync } from "./subscribeQueryAsync"

describe("subscribeQueryAsync notifications", () => {
	it("continues recomputing and notifying after a callback rejects", async () => {
		const db = new AsyncTupleDatabaseClient(
			new AsyncTupleDatabase(new InMemoryTupleStorage())
		)
		const seen: unknown[] = []
		const subscription = await subscribeQueryAsync(
			db,
			(db) => db.get(["a"]),
			async (value) => {
				seen.push(value)
				if (value === 1) throw new Error("Expected subscriber rejection")
			}
		)
		await db.commit({ set: [{ key: ["a"], value: 1 }] })
		await db.commit({ set: [{ key: ["a"], value: 2 }] })
		await Promise.resolve()
		assertEqual(seen, [1, 2])
		subscription.destroy()
	})

	it("does not deliver a result computed after destruction", async () => {
		const db = new AsyncTupleDatabaseClient(
			new AsyncTupleDatabase(new InMemoryTupleStorage())
		)
		const seen: unknown[] = []
		let release = () => {}
		let started = () => {}
		const blocked = new Promise<void>((resolve) => {
			release = resolve
		})
		const computing = new Promise<void>((resolve) => {
			started = resolve
		})
		let hold = false
		const subscription = await subscribeQueryAsync(
			db,
			async (db) => {
				const value = await db.get(["a"])
				if (hold) {
					started()
					await blocked
				}
				return value
			},
			(value) => {
				seen.push(value)
			}
		)
		hold = true
		const commit = db.commit({ set: [{ key: ["a"], value: 1 }] })
		await computing
		subscription.destroy()
		release()
		await commit
		await Promise.resolve()
		assertEqual(seen, [])
	})
})
