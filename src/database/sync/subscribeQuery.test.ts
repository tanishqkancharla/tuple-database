import { describe, it } from "mocha"
import { InMemoryTupleStorage } from "../../main"
import { assertEqual } from "../../test/assertHelpers"
import { subscribeQuery } from "./subscribeQuery"
import { TupleDatabase } from "./TupleDatabase"
import { TupleDatabaseClient } from "./TupleDatabaseClient"

describe("subscribeQuery", () => {
	it("works", async () => {
		const db = new TupleDatabaseClient(
			new TupleDatabase(new InMemoryTupleStorage())
		)

		function setA(a: number) {
			const tx = db.transact()
			tx.set(["a"], a)
			tx.commit()
		}

		setA(0)

		let aResult: number | undefined = undefined

		const { result, destroy } = subscribeQuery(
			db,
			(db) => db.get(["a"]),
			(result) => {
				aResult = result
			}
		)

		assertEqual(aResult, undefined)
		assertEqual(result, 0)

		setA(1)
		assertEqual(aResult, undefined)
		await Promise.resolve()

		assertEqual(aResult, 1)

		destroy()
	})

	it("doesn't run second callback if it is destroyed in first", async () => {
		type Schema =
			| {
					key: ["filesById", number]
					value: string
			  }
			| {
					key: ["focusedFileId"]
					value: number
			  }

		const db = new TupleDatabaseClient<Schema>(
			new TupleDatabase(new InMemoryTupleStorage())
		)

		const initTx = db.transact()
		initTx.set(["filesById", 1], "file 1 value")
		initTx.set(["focusedFileId"], 1)
		initTx.commit()

		let focusedFile: number | undefined = undefined
		let focusedFileValue: string | undefined = undefined
		let subscription:
			| { result: string | undefined; destroy: () => void }
			| undefined = undefined

		function subscribeToFocusedFile(focusedFile: number) {
			subscription = subscribeQuery(
				db,
				(db) => db.get(["filesById", focusedFile]),
				(value) => {
					focusedFileValue = value
				}
			)

			focusedFileValue = subscription.result
		}

		const focusedFileQuery = subscribeQuery(
			db,
			(db) => db.get(["focusedFileId"])!,
			(result) => {
				focusedFile = result
				subscription?.destroy()
				subscribeToFocusedFile(focusedFile)
			}
		)

		focusedFile = focusedFileQuery.result
		subscribeToFocusedFile(focusedFile)

		assertEqual(focusedFile, 1)
		assertEqual(focusedFileValue, "file 1 value")

		const tx = db.transact()
		tx.remove(["filesById", 1])
		tx.set(["filesById", 2], "file 2 value")
		tx.set(["focusedFileId"], 2)
		tx.commit()

		await Promise.resolve()
		assertEqual(focusedFile, 2)
		assertEqual(focusedFileValue, "file 2 value")
	})

	it("delivers every captured result after commit returns, in order", async () => {
		const db = new TupleDatabaseClient(
			new TupleDatabase(new InMemoryTupleStorage())
		)
		const seen: [boolean, number | undefined][] = []
		let commitsReturned = false
		const subscription = subscribeQuery(
			db,
			(db) => db.get(["a"]) as number | undefined,
			(value) => {
				seen.push([commitsReturned, value])
			}
		)

		db.commit({ set: [{ key: ["a"], value: 1 }] })
		db.commit({ set: [{ key: ["a"], value: 2 }] })
		assertEqual(db.get(["a"]), 2)
		assertEqual(seen, [])
		commitsReturned = true
		await Promise.resolve()
		assertEqual(seen, [
			[true, 1],
			[true, 2],
		])
		subscription.destroy()
	})

	it("cancels notifications already queued when destroyed", async () => {
		const db = new TupleDatabaseClient(
			new TupleDatabase(new InMemoryTupleStorage())
		)
		const seen: unknown[] = []
		const subscription = subscribeQuery(
			db,
			(db) => db.get(["a"]),
			(value) => {
				seen.push(value)
			}
		)
		db.commit({ set: [{ key: ["a"], value: 1 }] })
		subscription.destroy()
		await Promise.resolve()
		assertEqual(seen, [])
	})

	it("allows a subscriber to write without reentering its originating commit", async () => {
		const db = new TupleDatabaseClient(
			new TupleDatabase(new InMemoryTupleStorage())
		)
		const seen: unknown[] = []
		const subscription = subscribeQuery(
			db,
			(db) => db.get(["a"]),
			(value) => {
				seen.push(value)
				if (value === 1) db.commit({ set: [{ key: ["a"], value: 2 }] })
			}
		)
		db.commit({ set: [{ key: ["a"], value: 1 }] })
		assertEqual(db.get(["a"]), 1)
		await Promise.resolve()
		assertEqual(db.get(["a"]), 2)
		await Promise.resolve()
		assertEqual(seen, [1, 2])
		subscription.destroy()
	})

	it("continues delivering notifications after a subscriber throws", async () => {
		const db = new TupleDatabaseClient(
			new TupleDatabase(new InMemoryTupleStorage())
		)
		const seen: unknown[] = []
		const subscription = subscribeQuery(
			db,
			(db) => db.get(["a"]),
			(value) => {
				seen.push(value)
				if (value === 1) throw new Error("Expected subscriber failure")
			}
		)
		db.commit({ set: [{ key: ["a"], value: 1 }] })
		db.commit({ set: [{ key: ["a"], value: 2 }] })
		await Promise.resolve()
		assertEqual(seen, [1, 2])
		subscription.destroy()
	})
})
