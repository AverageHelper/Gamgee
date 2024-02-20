import type { Message } from "discord.js";
import type { Range } from "./editMessage.js";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { expectValueEqual } from "../../../tests/testUtils/expectations.js";
import {
	editMessage,
	escapeUriInString,
	positionsOfUriInText,
	stopEscapingUriInString,
	suppressEmbedsForMessage
} from "./editMessage.js";

const mockEdit = vi.fn();

vi.mock("../../logger.js", async () => ({
	useLogger: (await import("../../../tests/testUtils/logger.js")).useTestLogger
}));

describe("editing messages", () => {
	const message = {
		edit: mockEdit
	} as unknown as Message;
	const newValue = "new new new";

	test("calls the `edit` meethod of the given message", async () => {
		expectValueEqual(await editMessage(message, newValue), true);
		expect(mockEdit).toHaveBeenCalledOnce();
		expect(mockEdit).toHaveBeenCalledWith(newValue);
	});

	test("returns false when the message edit fails", async () => {
		mockEdit.mockRejectedValueOnce(new Error("This is a test"));
		expectValueEqual(await editMessage(message, newValue), false);
		expect(mockEdit).toHaveBeenCalledOnce();
		expect(mockEdit).toHaveBeenCalledWith(newValue);
	});
});

describe("Suppress embeds", () => {
	const mockSuppressEmbeds = vi.fn();

	const meId = "self-1234";
	const otherId = "other-1234";
	let message: Message;

	describe("on our own message", () => {
		beforeEach(() => {
			message = {
				content: "old old old",
				suppressEmbeds: mockSuppressEmbeds,
				edit: mockEdit,
				client: {
					user: {
						id: meId
					}
				},
				author: {
					id: meId
				}
			} as unknown as Message;
		});

		test("edits the message content directly to suppress embeds", async () => {
			await expect(suppressEmbedsForMessage(message, true)).resolves.toBeUndefined();
			expect(mockSuppressEmbeds).not.toHaveBeenCalled();
			expect(mockEdit).toHaveBeenCalledOnce();
			expect(mockEdit).toHaveBeenCalledWith({
				flags: ["SuppressEmbeds"],
				content: message.content,
				allowedMentions: { users: [] }
			});
		});

		test("edits the message content directly to unsuppress embeds", async () => {
			await expect(suppressEmbedsForMessage(message, false)).resolves.toBeUndefined();
			expect(mockSuppressEmbeds).not.toHaveBeenCalled();
			expect(mockEdit).toHaveBeenCalledOnce();
			expect(mockEdit).toHaveBeenCalledWith({
				flags: [],
				content: message.content
			});
		});

		test("doesn't throw if message edit fails", async () => {
			mockEdit.mockRejectedValueOnce(new Error("This is a test"));

			await expect(suppressEmbedsForMessage(message, true)).resolves.toBeUndefined();
			await expect(suppressEmbedsForMessage(message, false)).resolves.toBeUndefined();
		});
	});

	describe("on message not our own", () => {
		beforeEach(() => {
			message = {
				suppressEmbeds: mockSuppressEmbeds,
				client: {
					user: {
						id: meId
					}
				},
				author: {
					id: otherId
				}
			} as unknown as Message;
		});

		test("the `suppress`` parameter defaults to `true`", async () => {
			await expect(suppressEmbedsForMessage(message)).resolves.toBeUndefined();
			expect(mockSuppressEmbeds).toHaveBeenCalledOnce();
			expect(mockSuppressEmbeds).toHaveBeenCalledWith(true);
			expect(mockEdit).not.toHaveBeenCalled();
		});

		test("calls the suppressEmbeds method of the message if the sender is not us", async () => {
			await expect(suppressEmbedsForMessage(message, true)).resolves.toBeUndefined();
			expect(mockSuppressEmbeds).toHaveBeenCalledOnce();
			expect(mockSuppressEmbeds).toHaveBeenCalledWith(true);
			expect(mockEdit).not.toHaveBeenCalled();
		});

		test("doesn't throw if message edit fails", async () => {
			mockSuppressEmbeds.mockRejectedValueOnce(new Error("This is a test"));
			await expect(suppressEmbedsForMessage(message, true)).resolves.toBeUndefined();

			mockSuppressEmbeds.mockRejectedValueOnce(new Error("This is a test"));
			await expect(suppressEmbedsForMessage(message, false)).resolves.toBeUndefined();
		});
	});
});

describe("Identifying URIs in strings", () => {
	test.each`
		msg                                                            | ranges
		${""}                                                          | ${null}
		${"nothing"}                                                   | ${null}
		${"still nothing"}                                             | ${null}
		${"https://nope"}                                              | ${null}
		${"https://yep.com"}                                           | ${[{ start: 0, end: 15 }]}
		${"https://yep.com at the start"}                              | ${[{ start: 0, end: 15 }]}
		${"at the end https://yep.com"}                                | ${[{ start: 11, end: 26 }]}
		${"at the end https://yep.com there is more text"}             | ${[{ start: 11, end: 26 }]}
		${"https://yep.com https://yep.com"}                           | ${[{ start: 0, end: 15 }, { start: 16, end: 31 }]}
		${"https://yep.com stuff https://yep.com"}                     | ${[{ start: 0, end: 15 }, { start: 22, end: 37 }]}
		${"starts https://yep.com and https://yep.com"}                | ${[{ start: 7, end: 22 }, { start: 27, end: 42 }]}
		${"https://yep.com then https://yep.com ends"}                 | ${[{ start: 0, end: 15 }, { start: 21, end: 36 }]}
		${"https://yep.com https://yep.com then https://yep.com ends"} | ${[{ start: 0, end: 15 }, { start: 16, end: 31 }, { start: 37, end: 52 }]}
	`(
		"correctly identifies URI substring range(s) in string '$msg'",
		({ msg, ranges }: { msg: string; ranges: NonEmptyArray<Range> | null }) => {
			expect(positionsOfUriInText(msg)).toStrictEqual(ranges);
		}
	);
});

describe("Suppressing Embeds", () => {
	test.each`
		msg                                                            | result
		${""}                                                          | ${""}
		${"doesn't need supression"}                                   | ${"doesn't need supression"}
		${"https://example.com"}                                       | ${"<https://example.com>"}
		${"https://example.com at the start"}                          | ${"<https://example.com> at the start"}
		${"at the end, https://example.com"}                           | ${"at the end, <https://example.com>"}
		${"ya know, https://example.com is neat"}                      | ${"ya know, <https://example.com> is neat"}
		${"https://yep.com https://yep.com"}                           | ${"<https://yep.com> <https://yep.com>"}
		${"https://yep.com stuff https://yep.com"}                     | ${"<https://yep.com> stuff <https://yep.com>"}
		${"starts https://yep.com and https://yep.com"}                | ${"starts <https://yep.com> and <https://yep.com>"}
		${"https://yep.com then https://yep.com ends"}                 | ${"<https://yep.com> then <https://yep.com> ends"}
		${"https://yep.com https://yep.com then https://yep.com ends"} | ${"<https://yep.com> <https://yep.com> then <https://yep.com> ends"}
	`(
		"suppresses embeds from message content: '$msg'",
		({ msg, result }: { msg: string; result: string }) => {
			expectValueEqual(escapeUriInString(msg), result);
		}
	);

	test.each`
		msg                                                                  | result
		${"<https://example.com>"}                                           | ${"<https://example.com>"}
		${"<https://example.com> at the start"}                              | ${"<https://example.com> at the start"}
		${"at the end, <https://example.com>"}                               | ${"at the end, <https://example.com>"}
		${"ya know, <https://example.com> is neat"}                          | ${"ya know, <https://example.com> is neat"}
		${"<https://yep.com> <https://yep.com>"}                             | ${"<https://yep.com> <https://yep.com>"}
		${"<https://yep.com> stuff <https://yep.com>"}                       | ${"<https://yep.com> stuff <https://yep.com>"}
		${"starts <https://yep.com> and <https://yep.com>"}                  | ${"starts <https://yep.com> and <https://yep.com>"}
		${"<https://yep.com> then <https://yep.com> ends"}                   | ${"<https://yep.com> then <https://yep.com> ends"}
		${"<https://yep.com> <https://yep.com> then <https://yep.com> ends"} | ${"<https://yep.com> <https://yep.com> then <https://yep.com> ends"}
	`(
		"doesn't re-suppress embeds from message content: '$msg'",
		({ msg, result }: { msg: string; result: string }) => {
			expectValueEqual(escapeUriInString(msg), result);
		}
	);
});

describe("Allowing Embeds", () => {
	test.each`
		msg                                                                  | result
		${""}                                                                | ${""}
		${"doesn't need fixing"}                                             | ${"doesn't need fixing"}
		${"<https://example.com>"}                                           | ${"https://example.com"}
		${"<https://example.com> at the start"}                              | ${"https://example.com at the start"}
		${"at the end, <https://example.com>"}                               | ${"at the end, https://example.com"}
		${"ya know, <https://example.com> is neat"}                          | ${"ya know, https://example.com is neat"}
		${"<https://yep.com> <https://yep.com>"}                             | ${"https://yep.com https://yep.com"}
		${"<https://yep.com> stuff <https://yep.com>"}                       | ${"https://yep.com stuff https://yep.com"}
		${"starts <https://yep.com> and <https://yep.com>"}                  | ${"starts https://yep.com and https://yep.com"}
		${"<https://yep.com> then <https://yep.com> ends"}                   | ${"https://yep.com then https://yep.com ends"}
		${"<https://yep.com> <https://yep.com> then <https://yep.com> ends"} | ${"https://yep.com https://yep.com then https://yep.com ends"}
	`(
		"frees embeds from message content: '$msg'",
		({ msg, result }: { msg: string; result: string }) => {
			expectValueEqual(stopEscapingUriInString(msg), result);
		}
	);

	test.each`
		msg                                                            | result
		${"https://example.com"}                                       | ${"https://example.com"}
		${"https://example.com at the start"}                          | ${"https://example.com at the start"}
		${"at the end, https://example.com"}                           | ${"at the end, https://example.com"}
		${"ya know, https://example.com is neat"}                      | ${"ya know, https://example.com is neat"}
		${"https://yep.com https://yep.com"}                           | ${"https://yep.com https://yep.com"}
		${"https://yep.com stuff https://yep.com"}                     | ${"https://yep.com stuff https://yep.com"}
		${"starts https://yep.com and https://yep.com"}                | ${"starts https://yep.com and https://yep.com"}
		${"https://yep.com https://yep.com then https://yep.com ends"} | ${"https://yep.com https://yep.com then https://yep.com ends"}
	`(
		"doesn't re-free embeds from message content: '$msg'",
		({ msg, result }: { msg: string; result: string }) => {
			expectValueEqual(stopEscapingUriInString(msg), result);
		}
	);
});
