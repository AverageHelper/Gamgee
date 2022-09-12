import { addStrikethrough, removeStrikethrough } from "./strikethroughText.js";
import { expectValueEqual } from "../../../tests/testUtils/expectations/jest.js";

describe("Add strikethrough", () => {
	test("adds strikethrough to a normal string", () => {
		expectValueEqual(addStrikethrough("test"), "~~test~~");
	});

	test("does nothing to stricken text", () => {
		expectValueEqual(addStrikethrough("~~test~~"), "~~test~~");
	});

	test("adds strikethrough to left-stricken text", () => {
		expectValueEqual(addStrikethrough("~~strike me down"), "~~~~strike me down~~");
	});

	test("adds strikethrough to right-stricken text", () => {
		expectValueEqual(addStrikethrough("do it~~"), "~~do it~~~~");
	});

	test("does nothing to empty text", () => {
		expectValueEqual(addStrikethrough(""), "");
	});
});

describe("Remove strikethrough", () => {
	test("removes strikethrough from normal stricken text", () => {
		expectValueEqual(removeStrikethrough("~~test~~"), "test");
	});

	test("removes one strikethrough from over-stricken text", () => {
		expectValueEqual(removeStrikethrough("~~~~test~~~~"), "~~test~~");
		expectValueEqual(removeStrikethrough("~~test~~~~"), "test~~");
		expectValueEqual(removeStrikethrough("~~~~test~~"), "~~test");
	});

	test("does nothing to empty text", () => {
		expectValueEqual(removeStrikethrough(""), "");
	});

	test("does nothing to unstricken text", () => {
		expectValueEqual(removeStrikethrough("not stricken"), "not stricken");
	});

	test("does nothing to left-half-stricken text", () => {
		expectValueEqual(removeStrikethrough("~~not really stricken"), "~~not really stricken");
	});

	test("does nothing to right-half-stricken text", () => {
		expectValueEqual(removeStrikethrough("not really stricken~~"), "not really stricken~~");
	});
});
