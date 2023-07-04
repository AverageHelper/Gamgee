import "jest-extended";

/**
 * An array that always contains at least one element.
 */
type NonEmptyArray<T> = [T, ...Array<T>];

/**
 * A function which determines the type identity of the given value.
 */
type TypeGuard<T> = (tbd: unknown) => tbd is T;

/**
 * The element type of the given array.
 */
type GetArrayElementType<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer U>
	? U
	: never;
