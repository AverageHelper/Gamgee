import getChannelIdFromMention from "./getChannelIdFromMention.js";

describe("Channel ID from mention string", () => {
	test("returns null from an empty string", () => {
		expect(getChannelIdFromMention("")).toBeNull();
	});

	test("returns null from badly-formatted string", () => {
		expect(getChannelIdFromMention("54321")).toBeNull();
	});

	test("returns null from the front half of a mention", () => {
		expect(getChannelIdFromMention("<#")).toBeNull();
		expect(getChannelIdFromMention("<#54321")).toBeNull();
	});

	test("returns null from the back half of a mention", () => {
		expect(getChannelIdFromMention(">")).toBeNull();
		expect(getChannelIdFromMention("54321>")).toBeNull();
	});

	test("returns the string between valid mention identifiers", () => {
		expect(getChannelIdFromMention("<#>")).toBeNull();
		expect(getChannelIdFromMention("<#54321>")).toBe("54321");
		expect(getChannelIdFromMention("<#percy>")).toBe("percy");
	});
});
