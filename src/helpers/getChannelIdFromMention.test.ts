import "../../tests/testUtils/leakedHandles.js";
import { expectNull, expectValueEqual } from "../../tests/testUtils/expectations/jest.js";
import { getChannelIdFromMention } from "./getChannelIdFromMention.js";

describe("Channel ID from mention string", () => {
	test("returns null from an empty string", () => {
		expectNull(getChannelIdFromMention(""));
	});

	test("returns null from badly-formatted string", () => {
		expectNull(getChannelIdFromMention("54321"));
	});

	test("returns null from the front half of a mention", () => {
		expectNull(getChannelIdFromMention("<#"));
		expectNull(getChannelIdFromMention("<#54321"));
	});

	test("returns null from the back half of a mention", () => {
		expectNull(getChannelIdFromMention(">"));
		expectNull(getChannelIdFromMention("54321>"));
	});

	test("returns the string between valid mention identifiers", () => {
		expectNull(getChannelIdFromMention("<#>"));
		expectValueEqual(getChannelIdFromMention("<#54321>"), "54321");
		expectValueEqual(getChannelIdFromMention("<#percy>"), "percy");
	});
});
