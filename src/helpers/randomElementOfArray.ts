import { randomInt } from "./randomInt.js";

/**
 * Returns a random element from an array.
 *
 * @param array The array
 * @returns A random element of the array.
 */
export function randomElementOfArray<T>(array: Readonly<NonEmptyArray<T>>): T;

/**
 * Returns a random element from an array.
 *
 * @param array The array
 * @returns A random element of the array.
 */
export function randomElementOfArray<T>(array: ReadonlyArray<T>): T | undefined;

export function randomElementOfArray<T>(array: ReadonlyArray<T>): T | undefined {
	return array[randomInt(array.length)];
}
