import { expectValueEqual } from "../../../tests/testUtils/expectations.js";
import { describe, test } from "vitest";
import { removeCharactersAround } from "./unwrappedText.js";

describe("Remove strikethrough", () => {
	test("removes strikethrough from normal stricken text", () => {
		expectValueEqual(removeCharactersAround("~~test~~", "~~"), "test");
	});

	test("removes one strikethrough from over-stricken text", () => {
		expectValueEqual(removeCharactersAround("~~~~test~~~~", "~~"), "~~test~~");
		expectValueEqual(removeCharactersAround("~~test~~~~", "~~"), "test~~");
		expectValueEqual(removeCharactersAround("~~~~test~~", "~~"), "~~test");
	});

	test("does nothing to empty text", () => {
		expectValueEqual(removeCharactersAround("", "~~"), "");
	});

	test("does nothing to unstricken text", () => {
		expectValueEqual(removeCharactersAround("not stricken", "~~"), "not stricken");
	});

	test("does nothing to left-half-stricken text", () => {
		expectValueEqual(
			removeCharactersAround("~~not really stricken", "~~"),
			"~~not really stricken",
		);
	});

	test("does nothing to right-half-stricken text", () => {
		expectValueEqual(
			removeCharactersAround("not really stricken~~", "~~"),
			"not really stricken~~",
		);
	});

	test("allows a link embed", () => {
		expectValueEqual(
			removeCharactersAround("<https://example.com>", "<", ">"),
			"https://example.com",
		);
	});
});
