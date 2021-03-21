/**
 * Returns a random element from an array.
 *
 * The array should not be empty.
 *
 * @param array The array
 * @returns A random element of the array.
 */
export default function randomElementOfArray<T>(array: Array<T>): T {
  return array[Math.floor(Math.random() * array.length)];
}
