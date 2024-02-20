/**
 * Type-safe assertions to use in tests.
 */

import type { FixedLengthArray } from "type-fest";
import { expect } from "vitest";

/** Ensure that a value is an `Array`. */
export function expectArray(actual: unknown): asserts actual is Array<unknown> {
	return expect(Array.isArray(actual)).toBe(true);
}

/** Ensure that a value is an `Array` with the given number of elements. */
export function expectArrayOfLength<Length extends number>(
	actual: unknown,
	length: Length
): asserts actual is FixedLengthArray<unknown, Length> {
	expectArray(actual);
	return expect(actual).toHaveLength(length);
}

/** Ensure that a value is not `undefined`. */
export function expectDefined<T>(actual: T): asserts actual is Exclude<T, undefined> {
	return expect(actual).toBeDefined();
}

/** Checks that a value is the `null` value. */
export function expectNull(actual: unknown): asserts actual is null {
	return expect(actual).toBeNull();
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
	return expect(container).toContain(expected);
}

/** Checks that a value is `undefined`. */
export function expectUndefined(actual: unknown): asserts actual is undefined {
	return expect(actual).toBeUndefined();
}

/** Checks that a value is what you expect. */
export function expectValueEqual<T extends string | number | boolean>(
	actual: unknown,
	expected: T
): asserts actual is T {
	return expect(actual).toBe(expected);
}
