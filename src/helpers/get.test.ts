import { describe, expect, test } from "vitest";
import { get } from "./get.js";

describe("Get from object by keypath", () => {
	const object = { a: [{ b: { c: 3 } }] } as const;

	test.each([
		[3, "a[0].b.c"],
		[3, ["a", "0", "b", "c"]],
	] as const)("gets %s from query '%s'", (result, query) => {
		expect(get(object, query)).toBe(result);
	});
});
