import { AssertionError, notStrictEqual, strictEqual } from "node:assert/strict";

/** Ensure that a value is an `Array`. */
export function expectArray(actual: unknown): asserts actual is Array<unknown> {
	return strictEqual(Array.isArray(actual), true);
}

/** Ensure that a value is an `Array` with the given number of elements. */
export function expectArrayOfLength(
	actual: unknown,
	length: number
): asserts actual is Array<unknown> {
	expectArray(actual);
	return strictEqual(actual.length, length);
}

/** Ensure that a value is not `undefined`. */
export function expectDefined<T>(actual: T): asserts actual is Exclude<T, undefined> {
	return notStrictEqual(actual, undefined);
}

/** Checks that a value is less than another. */
export function expectLessThan(lhs: number, rhs: number): void {
	if (lhs >= rhs)
		throw new AssertionError({
			actual: `${lhs} >= ${rhs}`,
			expected: `${lhs} < ${rhs}`,
			message: `Expected ${lhs} to be less than ${rhs}`,
			operator: "<"
		});
}

/** Checks that a value is not the `null` value. */
export function expectNotNull<T>(actual: T): asserts actual is Exclude<T, null> {
	return notStrictEqual(actual, null);
}

/** Checks that a value is the `null` value. */
export function expectNull(actual: unknown): asserts actual is null {
	return strictEqual(actual, null);
}

/** Checks that a number is positive. */
export function expectPositive(actual: number): void {
	notStrictEqual(actual, true);
	strictEqual(Number.isNaN(actual), false);
	strictEqual(Number.isFinite(actual), true);
	strictEqual(actual > 0, true);
}

/**
 * Used when you want to check that an item is in a list.
 * For testing the items in the list, this uses ===, a
 * strict equality check.
 */
export function expectToContain<T>(
	container: ReadonlyArray<T> | string | null | undefined,
	expected: T
): void {
	// The empty string is a member of any string.
	if (typeof container === "string" && expected === "") return;

	if (container !== null && container !== undefined)
		for (const element of container) {
			try {
				// returns void if match, throws otherwise
				return strictEqual(element, expected);
			} catch {}
		}

	// We should never get here
	throw new AssertionError({
		message: `\`container\` was expected to contain ${JSON.stringify(expected)}`,
		actual: container,
		expected,
		operator: "strictEqual"
	});
}

/** Checks that a value is `undefined`. */
export function expectUndefined(actual: unknown): asserts actual is undefined {
	return strictEqual(actual, undefined);
}

/** Checks that a value is what you expect. */
export function expectValueEqual<T extends string | number | boolean>(
	actual: unknown,
	expected: T
): asserts actual is T {
	return strictEqual(actual, expected);
}
