import { split } from "./split.js";

describe("Split strings by separator", () => {
	test.each([
		["a.ham", ".", ["a", "ham"]],
		["a.burr", ".", ["a", "burr"]],
		["sam-hill-was", "-", ["sam", "hill", "was"]],
		["sam-hill-was", ".", ["sam-hill-was"]]
	] as const)("'%s' by '%s' -> '%s'", (source, separator, result) => {
		expect(split(source, separator)).toStrictEqual(result);
	});
});
