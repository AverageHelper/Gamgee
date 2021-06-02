import getUserIdFromMention from "./getUserIdFromMention";

describe("User ID from mention string", () => {
	test("returns null from an empty string", () => {
		expect(getUserIdFromMention("")).toBeNull();
	});

	test("returns null from badly-formatted string", () => {
		expect(getUserIdFromMention("54321")).toBeNull();
	});

	test("returns null from the front half of a mention", () => {
		expect(getUserIdFromMention("<@")).toBeNull();
		expect(getUserIdFromMention("<@!")).toBeNull();
		expect(getUserIdFromMention("<@54321")).toBeNull();
		expect(getUserIdFromMention("<@!54321")).toBeNull();
	});

	test("returns null from the back half of a mention", () => {
		expect(getUserIdFromMention(">")).toBeNull();
		expect(getUserIdFromMention("54321>")).toBeNull();
	});

	test("returns the string between valid mention identifiers", () => {
		expect(getUserIdFromMention("<@>")).toBe("");
		expect(getUserIdFromMention("<@!>")).toBe("");
		expect(getUserIdFromMention("<@54321>")).toBe("54321");
		expect(getUserIdFromMention("<@!54321>")).toBe("54321");
		expect(getUserIdFromMention("<@percy>")).toBe("percy");
		expect(getUserIdFromMention("<@!percy>")).toBe("percy");
	});
});
