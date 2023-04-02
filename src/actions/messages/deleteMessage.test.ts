import "../../../tests/testUtils/leakedHandles.js";
import type { Message, TextChannel } from "discord.js";
import { bulkDeleteMessagesWithIds, deleteMessage } from "./deleteMessage.js";
import { ChannelType, DiscordAPIError } from "discord.js";

const mockBulkDelete = jest.fn();
const mockSingleDelete = jest.fn();

describe("Single Message Delete", () => {
	let channel: TextChannel;
	let message: Message;

	beforeEach(() => {
		channel = {
			type: ChannelType.GuildText
		} as unknown as TextChannel;
		message = {
			delete: mockSingleDelete,
			channel
		} as unknown as Message;
	});

	test("refuses to do anything with DMs", async () => {
		channel = { ...channel, type: ChannelType.DM } as unknown as TextChannel;
		message = { ...message, channel } as unknown as Message;
		await expect(deleteMessage(message)).resolves.toBeFalse();
		expect(mockSingleDelete).not.toHaveBeenCalled();
	});

	test("calls the `delete` method of the message", async () => {
		await expect(deleteMessage(message)).resolves.toBeTrue();
		expect(mockSingleDelete).toHaveBeenCalledOnce();
	});

	test("returns false when the `delete` method of the message throws", async () => {
		jest.spyOn(global.console, "error").mockImplementation(() => undefined);

		mockSingleDelete.mockRejectedValueOnce(new Error("This is a test"));
		await expect(deleteMessage(message)).resolves.toBeFalse();
		expect(mockSingleDelete).toHaveBeenCalledOnce();

		jest.restoreAllMocks();
	});
});

describe("Bulk Message Delete", () => {
	let channel: TextChannel;

	beforeEach(() => {
		channel = {
			bulkDelete: mockBulkDelete,
			messages: {
				delete: mockSingleDelete
			}
		} as unknown as TextChannel;

		mockBulkDelete.mockImplementation((ids: ReadonlyArray<string>) => {
			// Discord balks when we try <2 || >100 IDs
			if (ids.length < 2 || ids.length > 100) {
				return Promise.reject(new Error("Can't delete fewer than 2 or more than 100"));
			}
			return Promise.resolve();
		});
	});

	test.each`
		count  | multiples | singles
		${2}   | ${1}      | ${0}
		${3}   | ${1}      | ${0}
		${45}  | ${1}      | ${0}
		${99}  | ${1}      | ${0}
		${100} | ${1}      | ${0}
		${101} | ${1}      | ${1}
		${800} | ${8}      | ${0}
	`(
		"Clears when the queue has $count items in it",
		async (params: { count: number; multiples: number; singles: number }) => {
			const { count, multiples, singles } = params;
			// Use an array of `count` instances of "a"
			const messageIds = new Array<string>(count).fill("a");
			await expect(bulkDeleteMessagesWithIds(messageIds, channel)).resolves.toBeTrue();

			expect(mockBulkDelete).toHaveBeenCalledTimes(multiples);
			expect(mockSingleDelete).toHaveBeenCalledTimes(singles);
		}
	);

	test("returns false when bulk deletion fails for an unknown reason", async () => {
		jest.spyOn(global.console, "error").mockImplementation(() => undefined);

		mockBulkDelete.mockRejectedValueOnce(new Error("This is a test"));
		const messageIds = ["a", "b"] as const;
		await expect(bulkDeleteMessagesWithIds(messageIds, channel)).resolves.toBeFalse();
		expect(mockBulkDelete).toHaveBeenCalledOnce();
		expect(mockSingleDelete).not.toHaveBeenCalled();

		jest.restoreAllMocks();
	});

	const tooOldError = new DiscordAPIError(
		{ code: 50034, error: "" },
		50034,
		400,
		"DELETE",
		"https://example.com",
		{}
	);

	test("falls back on individual deletions when queue contains messages older than 14 days", async () => {
		jest.spyOn(global.console, "warn").mockImplementation(() => undefined);

		mockBulkDelete.mockRejectedValue(tooOldError);
		const messageIds = ["a", "b"] as const;
		await expect(bulkDeleteMessagesWithIds(messageIds, channel)).resolves.toBeTrue();
		expect(mockSingleDelete).toHaveBeenCalledTimes(2);
		expect(mockSingleDelete).toHaveBeenNthCalledWith(1, messageIds[0]);
		expect(mockSingleDelete).toHaveBeenNthCalledWith(2, messageIds[1]);

		jest.restoreAllMocks();
	});

	test("falls back on individual deletions when queue contains messages older than 14 days, not caring about further errors", async () => {
		jest.spyOn(global.console, "error").mockImplementation(() => undefined);
		jest.spyOn(global.console, "warn").mockImplementation(() => undefined);
		jest.spyOn(global.console, "info").mockImplementation(() => undefined);

		mockBulkDelete.mockRejectedValue(tooOldError);
		mockSingleDelete.mockRejectedValueOnce(tooOldError);
		const messageIds = ["a", "b"] as const;
		await expect(bulkDeleteMessagesWithIds(messageIds, channel)).resolves.toBeTrue();
		expect(mockSingleDelete).toHaveBeenCalledTimes(2);
		expect(mockSingleDelete).toHaveBeenNthCalledWith(1, messageIds[0]);
		expect(mockSingleDelete).toHaveBeenNthCalledWith(2, messageIds[1]);

		jest.restoreAllMocks();
	});

	test("Deletes one message individually", async () => {
		const messageIds: Array<string> = ["a"];
		await expect(bulkDeleteMessagesWithIds(messageIds, channel)).resolves.toBeTrue();

		expect(mockBulkDelete).not.toHaveBeenCalled();
		expect(mockSingleDelete).toHaveBeenCalledOnce();
		expect(mockSingleDelete).toHaveBeenCalledWith("a");
	});

	test("Does nothing when the queue has 0 items in it", async () => {
		const messageIds = new Array<string>();
		await expect(bulkDeleteMessagesWithIds(messageIds, channel)).resolves.toBeTrue();

		expect(mockBulkDelete).not.toHaveBeenCalled();
	});
});
