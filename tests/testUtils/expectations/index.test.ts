import type { AssertionLib } from "./index.js";
import { expect } from "chai";
import {
	expectArray,
	expectArrayOfLength,
	expectDefined,
	expectLessThan,
	expectNotNull,
	expectNull,
	expectPositive,
	expectToContain,
	expectUndefined,
	expectValueEqual
} from "./index.js";

const libs: ReadonlyArray<AssertionLib> = ["vitest", "chai", "node"];

for (const lib of libs) {
	describe(`Modular test assertions for lib '${lib}'`, function () {
		describe("container membership", function () {
			const notInArgs = [
				["a", [] as ReadonlyArray<"a" | "b" | "c">], //
				["d", ["a", "b", "c"]],
				["", ["a", "b", "c"]],
				["z", "abc"],
				[null, "abc"]
			] as const;
			for (const [value, container] of notInArgs) {
				it(`throws when ${JSON.stringify(container)} doesn't have ${JSON.stringify(
					value
				)}`, function () {
					expect(() => expectToContain(container, value, lib)).to.throw(Error);
				});
			}

			const inArgs = [
				["a", ["a"]], //
				["a", ["a", "b", "c"]],
				["b", ["a", "b", "c"]],
				["c", ["a", "b", "c"]],
				["", ["a", "b", "c", ""]],
				["", "abc"],
				["a", "abc"],
				["b", "abc"],
				["c", "abc"]
			] as const;
			for (const [value, container] of inArgs) {
				it(`does not throw when ${JSON.stringify(container)} has '${value}'`, function () {
					expect(expectToContain(container, value, lib)).to.be.undefined;
				});
			}

			it("throws if `container` is `null`", function () {
				expect(() => expectToContain(null, "", lib)).to.throw(Error);
			});

			it("throws if `container` is `undefined`", function () {
				expect(() => expectToContain(undefined, "", lib)).to.throw(Error);
			});

			const notArrays = [
				"", //
				"a",
				0,
				1,
				null,
				undefined
			] as const;
			for (const value of notArrays) {
				it(`throws when ${JSON.stringify(value)} is not an \`Array\``, function () {
					expect(() => expectArray(value, lib)).to.throw(Error);
					expect(() => expectArrayOfLength(value, 0, lib)).to.throw(Error);
					expect(() => expectArrayOfLength(value, 1, lib)).to.throw(Error);
				});
			}

			const arrays = [
				[[], 0], //
				[[""], 1],
				[["", 1], 2]
			] as const;
			for (const [value, length] of arrays) {
				it(`doesn't throw when ${JSON.stringify(value)} is an \`Array\``, function () {
					expect(expectArray(value, lib)).to.be.undefined;
					expect(expectArrayOfLength(value, length, lib)).to.be.undefined;
				});
			}
		});

		describe("nullishness", function () {
			const args = [
				"a", //
				"",
				0,
				[],
				["a"]
			];
			for (const arg of args) {
				it(`throws when ${JSON.stringify(arg)} is not \`null\``, function () {
					expect(() => expectNull(arg, lib)).to.throw(Error);
				});

				it(`throws when ${JSON.stringify(arg)} is not \`undefined\``, function () {
					expect(() => expectUndefined(arg, lib)).to.throw(Error);
				});

				it(`does not throw when ${JSON.stringify(arg)} is not \`undefined\``, function () {
					expect(expectDefined(arg, lib)).to.be.undefined;
				});
			}

			it("throws when `undefined` is not `null`", function () {
				expect(() => expectNull(undefined, lib)).to.throw(Error);
			});

			it("throws when `null` is not `undefined`", function () {
				expect(() => expectUndefined(null, lib)).to.throw(Error);
			});

			it("does not throw for `null`", function () {
				expect(expectNull(null, lib)).to.be.undefined;
			});

			it("does not throw for `undefined`", function () {
				expect(expectUndefined(undefined, lib)).to.be.undefined;
				expect(expectNotNull(undefined, lib)).to.be.undefined;
			});

			it("throws for `undefined`", function () {
				expect(() => expectDefined(undefined, lib)).to.throw(Error);
			});

			it("throws for `null`", function () {
				expect(() => expectNotNull(null, lib)).to.throw(Error);
			});
		});

		describe("number comparisons", function () {
			const ltComparisonsWrong = [
				[6, 5], //
				[6, 0],
				[6, -5]
			] as const;
			for (const [lhs, rhs] of ltComparisonsWrong) {
				it(`throws when ${lhs} is not < ${rhs}`, function () {
					expect(() => expectLessThan(lhs, rhs, lib)).to.throw(Error);
				});
			}

			const ltComparisonsRight = [
				[5, 6], //
				[0, 6],
				[-5, 6]
			] as const;
			for (const [lhs, rhs] of ltComparisonsRight) {
				it(`does not throw when ${lhs} is < ${rhs}`, function () {
					expect(expectLessThan(lhs, rhs, lib)).to.be.undefined;
				});
			}

			const notPositive = [
				// eslint-disable-next-line unicorn/prefer-number-properties
				Infinity,
				// eslint-disable-next-line unicorn/prefer-number-properties
				NaN,
				-1,
				-5,
				-9007199254740991,
				-0 // weird, but ok
			] as const;
			for (const num of notPositive) {
				it(`throws when ${num} is not positive`, function () {
					expect(() => expectPositive(num, lib)).to.throw(Error);
				});
			}

			const positive = [
				1, //
				5,
				9007199254740991,
				1.79e308
			] as const;
			for (const num of positive) {
				it(`does not throw when ${num} is positive`, function () {
					expect(expectPositive(num, lib)).to.be.undefined;
				});
			}
		});

		describe("value equality", function () {
			const unequalArgs = [
				["a", "b"], //
				["a", ""]
			] as const;
			for (const [a, b] of unequalArgs) {
				it(`throws for unequal values (${a}, ${b})`, function () {
					expect(() => expectValueEqual(a, b, lib)).to.throw(Error);
				});

				// do the same in reverse
				it(`throws for unequal values (${b}, ${a})`, function () {
					expect(() => expectValueEqual(b, a, lib)).to.throw(Error);
				});
			}

			const equalArgs = [
				"a", //
				"b",
				1,
				0,
				9007199254740991,
				-9007199254740991
			] as const;
			for (const arg of equalArgs) {
				it(`does not throw for equal values (${arg}, ${arg})`, function () {
					expect(expectValueEqual(arg, arg, lib)).to.be.undefined;
				});
			}
		});
	});
}
