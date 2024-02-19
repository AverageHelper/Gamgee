import type { Get } from "type-fest";

import _get from "lodash-es/get.js";

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @param object The object to query.
 * @param path The path of the property to get.
 * @returns Returns the resolved value.
 * @example
 *
 * const object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * get(object, 'a[0].b.c');
 * // => 3
 *
 * get(object, ['a', '0', 'b', 'c']);
 * // => 3
 */
export function get<BaseType, Path extends string | ReadonlyArray<string>>(
	object: BaseType,
	path: Path
): Get<BaseType, Path> {
	return _get(object, path) as Get<BaseType, Path>;
}

export type { Get };
