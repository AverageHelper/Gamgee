import type { Split } from "type-fest";

/**
 * Split a string into substrings using the specified separator and return
 * them as an array.
 *
 * @param string The string to split.
 * @param separator A string that identifies character or characters to use
 * in separating the string.
 */
export function split<S extends string, D extends string>(string: S, separator: D): Split<S, D> {
	return string.split(separator) as Split<S, D>;
}
