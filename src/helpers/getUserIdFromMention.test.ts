import { expectNull, expectValueEqual } from "../../tests/testUtils/expectations/jest.js";
import { getUserIdFromMention } from "./getUserIdFromMention.js";

describe("User ID from mention string", () => {
	test("returns null from an empty string", () => {
		expectNull(getUserIdFromMention(""));
	});

	test("returns null from badly-formatted string", () => {
		expectNull(getUserIdFromMention("54321"));
	});

	test("returns null from the front half of a mention", () => {
		expectNull(getUserIdFromMention("<@"));
		expectNull(getUserIdFromMention("<@!"));
		expectNull(getUserIdFromMention("<@54321"));
		expectNull(getUserIdFromMention("<@!54321"));
	});

	test("returns null from the back half of a mention", () => {
		expectNull(getUserIdFromMention(">"));
		expectNull(getUserIdFromMention("54321>"));
	});

	test("returns the string between valid mention identifiers", () => {
		expectNull(getUserIdFromMention("<@>"));
		expectNull(getUserIdFromMention("<@!>"));
		expectValueEqual(getUserIdFromMention("<@54321>"), "54321");
		expectValueEqual(getUserIdFromMention("<@!54321>"), "54321");
		expectValueEqual(getUserIdFromMention("<@percy>"), "percy");
		expectValueEqual(getUserIdFromMention("<@!percy>"), "percy");
	});
});
