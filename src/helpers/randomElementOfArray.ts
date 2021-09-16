/**
 * Returns a random element from an array.
 *
 * @param array The array
 * @returns A random element of the array.
 */
export default function randomElementOfArray<T>(array: NonEmptyArray<T>): T;

/**
 * Returns a random element from an array.
 *
 * @param array The array
 * @returns A random element of the array.
 */
export default function randomElementOfArray<T>(array: Array<T>): T | undefined;

export default function randomElementOfArray<T>(array: Array<T>): T | undefined {
	return array[Math.floor(Math.random() * array.length)];
}
