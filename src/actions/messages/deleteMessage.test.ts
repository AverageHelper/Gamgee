import type { TextChannel } from "discord.js";
import { bulkDeleteMessagesWithIds } from "./deleteMessage.js";

const mockBulkDelete = jest.fn();
const mockSingleDelete = jest.fn();

describe("Bulk Message Delete", () => {
	let channel: TextChannel;

	beforeEach(() => {
		channel = {
			bulkDelete: mockBulkDelete,
			messages: {
				delete: mockSingleDelete
			}
		} as unknown as TextChannel;

		mockBulkDelete.mockImplementation((ids: Array<string>) => {
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
