import { addCharactersAround } from "./wrappedText.js";
import { describe, test } from "vitest";
import { expectValueEqual } from "../../../tests/testUtils/expectations/vitest.js";

describe("Add pre- and postfix", () => {
	test("adds strikethrough to a normal string", () => {
		expectValueEqual(addCharactersAround("test", "~~"), "~~test~~");
	});

	test("does nothing to stricken text", () => {
		expectValueEqual(addCharactersAround("~~test~~", "~~"), "~~test~~");
	});

	test("adds strikethrough to left-stricken text", () => {
		expectValueEqual(addCharactersAround("~~strike me down", "~~"), "~~~~strike me down~~");
	});

	test("adds strikethrough to right-stricken text", () => {
		expectValueEqual(addCharactersAround("do it~~", "~~"), "~~do it~~~~");
	});

	test("does nothing to empty text", () => {
		expectValueEqual(addCharactersAround("", "~~"), "");
	});

	test("prevents a link embed", () => {
		expectValueEqual(addCharactersAround("https://example.com", "<", ">"), "<https://example.com>");
	});
});
