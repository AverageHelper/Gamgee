import { expect } from "chai";

/** Ensure that a value is an `Array`. */
export function expectArray(actual: unknown): asserts actual is Array<unknown> {
	expect(Array.isArray(actual)).to.be.true;
}

/** Ensure that a value is an `Array` with the given number of elements. */
export function expectArrayOfLength(
	actual: unknown,
	length: number,
): asserts actual is Array<unknown> {
	expectArray(actual);
	expect(actual).to.have.lengthOf(length);
}

/** Ensure that a value is not `undefined`. */
export function expectDefined<T>(actual: T): asserts actual is Exclude<T, undefined> {
	expect(actual).not.to.be.undefined;
}

/** Checks that a value is less than another. */
export function expectLessThan(lhs: number, rhs: number): void {
	expect(lhs).to.be.lessThan(rhs);
}

/** Checks that a value is not the `null` value. */
export function expectNotNull<T>(actual: T): asserts actual is Exclude<T, null> {
	expect(actual).not.to.be.null;
}

/** Checks that a value is the `null` value. */
export function expectNull(actual: unknown): asserts actual is null {
	expect(actual).to.be.null;
}

/** Checks that a number is positive. */
export function expectPositive(actual: number): void {
	expect(actual).not.to.be.true;
	expect(actual).not.to.be.NaN;
	expect(actual).not.to.equal(Number.POSITIVE_INFINITY);
	expect(actual).to.be.greaterThan(0);
}

/**
 * Used when you want to check that an item is in a list.
 * For testing the items in the list, this uses ===, a
 * strict equality check.
 */
export function expectToContain<T>(
	container: ReadonlyArray<T> | string | null | undefined,
	expected: T,
): void {
	expect(container).to.contain(expected);
}

/** Checks that a value is `undefined`. */
export function expectUndefined(actual: unknown): asserts actual is undefined {
	expect(actual).to.be.undefined;
}

/** Checks that a value is what you expect. */
export function expectValueEqual<T extends string | number | boolean>(
	actual: unknown,
	expected: T,
): asserts actual is T {
	expect(actual).to.equal(expected);
}
