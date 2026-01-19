export { default as isFunction } from "lodash-es/isFunction.js";

export function isNonEmptyArray<T>(array: ReadonlyArray<T>): array is NonEmptyArray<T> {
	return array.length > 0;
}

export function isNotNull<T>(tbd: T | null): tbd is T {
	return tbd !== null;
}

export function isString(tbd: unknown): tbd is string {
	return tbd !== null && (typeof tbd === "string" || tbd instanceof String);
}
