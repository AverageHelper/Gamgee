import { addStrikethrough, removeStrikethrough } from "./strikethroughText.js";

describe("Add strikethrough", () => {
	test("adds strikethrough to a normal string", () => {
		expect(addStrikethrough("test")).toBe("~~test~~");
	});

	test("does nothing to stricken text", () => {
		expect(addStrikethrough("~~test~~")).toBe("~~test~~");
	});

	test("adds strikethrough to left-stricken text", () => {
		expect(addStrikethrough("~~strike me down")).toBe("~~~~strike me down~~");
	});

	test("adds strikethrough to right-stricken text", () => {
		expect(addStrikethrough("do it~~")).toBe("~~do it~~~~");
	});

	test("does nothing to empty text", () => {
		expect(addStrikethrough("")).toBe("");
	});
});

describe("Remove strikethrough", () => {
	test("removes strikethrough from normal stricken text", () => {
		expect(removeStrikethrough("~~test~~")).toBe("test");
	});

	test("removes one strikethrough from over-stricken text", () => {
		expect(removeStrikethrough("~~~~test~~~~")).toBe("~~test~~");
		expect(removeStrikethrough("~~test~~~~")).toBe("test~~");
		expect(removeStrikethrough("~~~~test~~")).toBe("~~test");
	});

	test("does nothing to empty text", () => {
		expect(removeStrikethrough("")).toBe("");
	});

	test("does nothing to unstricken text", () => {
		expect(removeStrikethrough("not stricken")).toBe("not stricken");
	});

	test("does nothing to left-half-stricken text", () => {
		expect(removeStrikethrough("~~not really stricken")).toBe("~~not really stricken");
	});

	test("does nothing to right-half-stricken text", () => {
		expect(removeStrikethrough("not really stricken~~")).toBe("not really stricken~~");
	});
});
