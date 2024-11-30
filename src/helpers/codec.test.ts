import { strict as assert } from "assert"
import { describe, it } from "mocha"
import { Tuple } from "../storage/types"
import { sortedValues } from "../test/fixtures"
import { decodeTuple, decodeValue, encodeTuple, encodeValue } from "./codec"
import { compare } from "./compare"
import { TupleToString, ValueToString } from "./compareTuple"
import { randomInt } from "./randomInt"

describe("codec", () => {
	describe("encodeValue", () => {
		it("Encodes and decodes properly", () => {
			for (let i = 0; i < sortedValues.length; i++) {
				const value = sortedValues[i]
				const encoded = encodeValue(value)
				const decoded = decodeValue(encoded)

				assert.deepStrictEqual(
					decoded,
					value,
					[
						ValueToString(value),
						ValueToString(encoded),
						ValueToString(decoded),
					].join(" -> ")
				)
			}
		})

		it("Encodes in lexicographical order", () => {
			for (let i = 0; i < sortedValues.length; i++) {
				for (let j = 0; j < sortedValues.length; j++) {
					const a = encodeValue(sortedValues[i])
					const b = encodeValue(sortedValues[j])
					assert.deepStrictEqual(
						compare(a, b),
						compare(i, j),
						`compareValue(${[
							ValueToString(sortedValues[i]),
							ValueToString(sortedValues[j]),
						].join(", ")}) === compare(${[
							JSON.stringify(a),
							JSON.stringify(b),
						].join(", ")})`
					)
				}
			}
		})
	})

	describe("encodeTuple", () => {
		it("Encodes and decodes properly", () => {
			const test = (tuple: Tuple) => {
				const encoded = encodeTuple(tuple)
				const decoded = decodeTuple(encoded)
				assert.deepStrictEqual(
					decoded,
					tuple,
					[
						TupleToString(tuple),
						ValueToString(encoded),
						TupleToString(decoded),
					].join(" -> ")
				)
			}
			test([])
			for (let i = 0; i < sortedValues.length; i++) {
				const a = sortedValues[i]
				test([a])
				for (let j = 0; j < sortedValues.length; j++) {
					const b = sortedValues[j]
					test([a, b])
				}
			}

			for (let i = 0; i < sortedValues.length - 2; i++) {
				const opts = sortedValues.slice(i, i + 3)
				for (const a of opts) {
					for (const b of opts) {
						for (const c of opts) {
							test([a, b, c])
						}
					}
				}
			}
		})

		it("Encodes in lexicographical order", () => {
			const test2 = (
				a: { tuple: Tuple; rank: number },
				b: { tuple: Tuple; rank: number },
				result: number
			) => {
				try {
					test(a.tuple, b.tuple, result)
				} catch (e) {
					console.log({ aRank: a.rank, bRank: b.rank })
					throw e
				}
			}

			const test = (aTuple: Tuple, bTuple: Tuple, result: number) => {
				const a = encodeTuple(aTuple)
				const b = encodeTuple(bTuple)
				const actual = compare(a, b)
				const expected = result
				try {
					assert.deepStrictEqual(
						actual,
						expected,
						`compareTuple(${[TupleToString(aTuple), TupleToString(bTuple)].join(
							", "
						)}) === compare(${[JSON.stringify(a), JSON.stringify(b)].join(", ")})`
					)
				} catch (e) {
					console.log({ aTuple, bTuple, a, b, actual, expected })
					throw e
				}
			}

			for (let i = 0; i < sortedValues.length; i++) {
				for (let j = 0; j < sortedValues.length; j++) {
					const a = sortedValues[i]
					const b = sortedValues[j]
					try {
						test([a, a], [a, b], compare(i, j))
					} catch (e) {
						console.log({ i, j })
						throw e
					}
					test([a, b], [b, a], compare(i, j))
					test([b, a], [b, b], compare(i, j))
					if (i !== j) {
						test([a], [a, a], -1)
						test([a], [a, b], -1)
						test([a], [b, a], compare(i, j))
						test([a], [b, b], compare(i, j))
						test([b], [a, a], compare(j, i))
						test([b], [a, b], compare(j, i))
						test([b], [b, a], -1)
						test([b], [b, b], -1)
					}
				}
			}

			const sample = () => {
				const x = sortedValues.length
				const i = randomInt(x - 1)
				const j = randomInt(x - 1)
				const k = randomInt(x - 1)
				const tuple: Tuple = [sortedValues[i], sortedValues[j], sortedValues[k]]
				const rank = i * x * x + j * x + k
				return { tuple, rank }
			}

			// (40*40*40)^2 = 4 billion variations for these sorted 3-length tuples.
			for (let iter = 0; iter < 100_000; iter++) {
				const a = sample()
				const b = sample()
				test2(a, b, compare(a.rank, b.rank))
			}
		})
	})

	describe("codec options", () => {
		it("Throws error if a value cannot be encoded", () => {
			assert.throws(() => encodeValue("a\x00b", { disallow: ["\x00"] }))
		})

		it("Encodes and decodes with custom delimiter and escape characters", () => {
			const options = { delimiter: ":", escape: "\\", disallow: [] }
			const testCases = [
				"simple",
				"with:delimiter",
				"with\\escape",
				"with\\:both",
				"multiple::delimiters",
				"multiple\\\\escapes",
				"mixed\\::\\\\:cases",
			]

			for (const value of testCases) {
				const encoded = encodeValue(value, options)
				const decoded = decodeValue(encoded, options)

				assert.deepStrictEqual(
					decoded,
					value,
					`Failed with custom options ${JSON.stringify(options, undefined, 2)}\n` +
						[
							ValueToString(value),
							ValueToString(encoded),
							ValueToString(decoded),
						].join(" -> ")
				)
			}
		})

		it("Handles all encoding options configurations", () => {
			const options = { delimiter: "\x01", escape: "\x02", disallow: ["\x00"] }

			const testCases = [
				"normal string",
				"with spaces",
				"with,punctuation!",
				"with\nnewline",
				"with\ttab",
			]

			for (const value of testCases) {
				const encoded = encodeValue(value, options)
				const decoded = decodeValue(encoded, options)

				assert.deepStrictEqual(
					decoded,
					value,
					`Failed with custom options ${JSON.stringify(options, undefined, 2)}\n` +
						[
							ValueToString(value),
							ValueToString(encoded),
							ValueToString(decoded),
						].join(" -> ")
				)
			}
		})

		it("Maintains proper escaping with nested delimiters", () => {
			const options = { delimiter: ":", escape: "\\", disallow: [] }
			const complexValue = "a:b\\:c\\\\:d"
			const encoded = encodeValue(complexValue, options)
			const decoded = decodeValue(encoded, options)

			assert.deepStrictEqual(
				decoded,
				complexValue,
				`Failed with custom options ${JSON.stringify(options, undefined, 2)}\n` +
					[
						ValueToString(complexValue),
						ValueToString(encoded),
						ValueToString(decoded),
					].join(" -> ")
			)
		})
	})
})
