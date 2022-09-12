// ***
// Functional value assertions that use one of many canonical assertion libraries
// ***

import {
	expectArray as jestExpectArray,
	expectArrayOfLength as jestExpectArrayOfLength,
	expectDefined as jestExpectDefined,
	expectLessThan as jestExpectLessThan,
	expectNotNull as jestExpectNotNull,
	expectNull as jestExpectNull,
	expectPositive as jestExpectPositive,
	expectToContain as jestExpectToContain,
	expectUndefined as jestExpectUndefined,
	expectValueEqual as jestExpectValueEqual
} from "./jest";

import {
	expectArray as chaiExpectArray,
	expectArrayOfLength as chaiExpectArrayOfLength,
	expectDefined as chaiExpectDefined,
	expectLessThan as chaiExpectLessThan,
	expectNotNull as chaiExpectNotNull,
	expectNull as chaiExpectNull,
	expectPositive as chaiExpectPositive,
	expectToContain as chaiExpectToContain,
	expectUndefined as chaiExpectUndefined,
	expectValueEqual as chaiExpectValueEqual
} from "./chai";

import {
	expectArray as nodeExpectArray,
	expectArrayOfLength as nodeExpectArrayOfLength,
	expectDefined as nodeExpectDefined,
	expectLessThan as nodeExpectLessThan,
	expectNotNull as nodeExpectNotNull,
	expectNull as nodeExpectNull,
	expectPositive as nodeExpectPositive,
	expectToContain as nodeExpectToContain,
	expectUndefined as nodeExpectUndefined,
	expectValueEqual as nodeExpectValueEqual
} from "./node";

export type AssertionLib = "@jest/expect" | "chai" | "node";

/** Ensure that a value is an `Array`. */
export function expectArray(actual: unknown, lib: AssertionLib): asserts actual is Array<unknown> {
	switch (lib) {
		case "@jest/expect":
			return jestExpectArray(actual);
		case "chai":
			return chaiExpectArray(actual);
		case "node":
			return nodeExpectArray(actual);
		default:
			return assertUnreachable(lib);
	}
}

/** Ensure that a value is an `Array` with the given number of elements. */
export function expectArrayOfLength(
	actual: unknown,
	length: number,
	lib: AssertionLib
): asserts actual is Array<unknown> {
	switch (lib) {
		case "@jest/expect":
			return jestExpectArrayOfLength(actual, length);
		case "chai":
			return chaiExpectArrayOfLength(actual, length);
		case "node":
			return nodeExpectArrayOfLength(actual, length);
		default:
			return assertUnreachable(lib);
	}
}

/** Ensure that a value is not `undefined`. */
export function expectDefined<T>(
	actual: T,
	lib: AssertionLib
): asserts actual is Exclude<T, undefined> {
	switch (lib) {
		case "@jest/expect":
			return jestExpectDefined(actual);
		case "chai":
			return chaiExpectDefined(actual);
		case "node":
			return nodeExpectDefined(actual);
		default:
			return assertUnreachable(lib);
	}
}

/** Checks that a value is less than another. */
export function expectLessThan(lhs: number, rhs: number, lib: AssertionLib): void {
	switch (lib) {
		case "@jest/expect":
			return jestExpectLessThan(lhs, rhs);
		case "chai":
			return chaiExpectLessThan(lhs, rhs);
		case "node":
			return nodeExpectLessThan(lhs, rhs);
		default:
			return assertUnreachable(lib);
	}
}

/** Checks that a value is not the `null` value. */
export function expectNotNull<T>(actual: T, lib: AssertionLib): asserts actual is Exclude<T, null> {
	switch (lib) {
		case "@jest/expect":
			return jestExpectNotNull(actual);
		case "chai":
			return chaiExpectNotNull(actual);
		case "node":
			return nodeExpectNotNull(actual);
		default:
			return assertUnreachable(lib);
	}
}

/** Checks that a value is the `null` value. */
export function expectNull(actual: unknown, lib: AssertionLib): asserts actual is null {
	switch (lib) {
		case "@jest/expect":
			return jestExpectNull(actual);
		case "chai":
			return chaiExpectNull(actual);
		case "node":
			return nodeExpectNull(actual);
		default:
			return assertUnreachable(lib);
	}
}

/** Checks that a number is positive. */
export function expectPositive(actual: number, lib: AssertionLib): void {
	switch (lib) {
		case "@jest/expect":
			return jestExpectPositive(actual);
		case "chai":
			return chaiExpectPositive(actual);
		case "node":
			return nodeExpectPositive(actual);
		default:
			return assertUnreachable(lib);
	}
}

/**
 * Used when you want to check that an item is in a list.
 * For testing the items in the list, this uses ===, a
 * strict equality check.
 */
export function expectToContain<T>(
	container: ReadonlyArray<T> | string | null | undefined,
	expected: T,
	lib: AssertionLib
): void {
	switch (lib) {
		case "@jest/expect":
			return jestExpectToContain(container, expected);
		case "chai":
			return chaiExpectToContain(container, expected);
		case "node":
			return nodeExpectToContain(container, expected);
		default:
			return assertUnreachable(lib);
	}
}

/** Checks that a value is `undefined`. */
export function expectUndefined(actual: unknown, lib: AssertionLib): asserts actual is undefined {
	switch (lib) {
		case "@jest/expect":
			return jestExpectUndefined(actual);
		case "chai":
			return chaiExpectUndefined(actual);
		case "node":
			return nodeExpectUndefined(actual);
		default:
			return assertUnreachable(lib);
	}
}

/** Checks that a value is what you expect. */
export function expectValueEqual<T extends string | number | boolean>(
	actual: unknown,
	expected: T,
	lib: AssertionLib
): asserts actual is T {
	switch (lib) {
		case "@jest/expect":
			return jestExpectValueEqual(actual, expected);
		case "chai":
			return chaiExpectValueEqual(actual, expected);
		case "node":
			return nodeExpectValueEqual(actual, expected);
		default:
			return assertUnreachable(lib);
	}
}

function assertUnreachable(x: never): never {
	// No need for i18n, since the user should never see this.
	// If the user does see this, that's a catastrophic bug.
	throw new TypeError(`Unexpected value ${JSON.stringify(x)}`);
}
