/**
 * Returns a random integer from 0 to the given `max`.
 *
 * @param max The max value that may be returned. Defaults to `Number.MAX_SAFE_INTEGER`.
 */
export function randomInt(max: number = Number.MAX_SAFE_INTEGER): number {
	return Math.floor(Math.random() * max);
}
