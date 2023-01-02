import "../../../tests/testUtils/leakedHandles.js";

jest.mock("../../actions/messages");
jest.mock("../../actions/queue/useQueue");
jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../useQueueStorage");
jest.mock("../../permissions");

import { bulkDeleteMessagesWithIds } from "../../actions/messages/index.js";
const mockBulkDeleteMessagesWithIds = bulkDeleteMessagesWithIds as jest.Mock;

import { deleteStoredEntriesForQueue, getAllStoredEntries } from "../../useQueueStorage.js";
const mockDeleteStoredEntriesForQueue = deleteStoredEntriesForQueue as jest.Mock;
const mockGetAllStoredEntries = getAllStoredEntries as jest.Mock;

import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import type { GuildedCommandContext } from "../Command.js";
import type { TextChannel } from "discord.js";
import { restart } from "./restart.js";
import { useTestLogger } from "../../../tests/testUtils/logger.js";

const mockPrepareForLongRunningTasks = jest.fn().mockResolvedValue(undefined);
const mockReply = jest.fn().mockResolvedValue(undefined);

const logger = useTestLogger();

describe("Clear queue contents", () => {
	let context: GuildedCommandContext;

	beforeEach(() => {
		context = {
			logger,
			guild: "the guild",
			prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
			reply: mockReply
		} as unknown as GuildedCommandContext;

		mockGetAllStoredEntries.mockResolvedValue([]);
		mockDeleteStoredEntriesForQueue.mockResolvedValue(undefined);
		mockBulkDeleteMessagesWithIds.mockResolvedValue(true);
	});

	test("does nothing when no queue is set up", async () => {
		mockGetQueueChannel.mockResolvedValue(null);

		await expect(restart.execute(context)).resolves.toBeUndefined();

		expect(mockReply).toHaveBeenCalledOnce();
		expect(mockReply).toHaveBeenCalledWith("No queue is set up. Maybe that's what you wanted...?");
		expect(mockDeleteStoredEntriesForQueue).not.toHaveBeenCalled();
	});

	test.each`
		channelId
		${"not-queue-channel"}
		${"queue-channel"}
		${"queue-channel"}
	`(
		"clears the queue when admin==$isAdmin and in $channelId",
		async ({ channelId }: { channelId: string }) => {
			const queueChannel = { id: "queue-channel" };
			const queueEntries = [
				{ queueMessageId: "message1" },
				{ queueMessageId: "message2" },
				{ queueMessageId: "message3" }
			];
			mockGetQueueChannel.mockResolvedValue(queueChannel);
			mockGetAllStoredEntries.mockResolvedValue(queueEntries);
			context = {
				...context,
				channel: {
					id: channelId
				} as unknown as TextChannel
			};

			await expect(restart.execute(context)).resolves.toBeUndefined();

			// Feedback
			expect(mockPrepareForLongRunningTasks).toHaveBeenCalledOnce();
			expect(mockReply).toHaveBeenCalledOnce();
			expect(mockReply).toHaveBeenCalledWith("The queue has restarted.");

			// Actions
			expect(mockDeleteStoredEntriesForQueue).toHaveBeenCalledOnce();
			expect(mockDeleteStoredEntriesForQueue).toHaveBeenCalledWith(queueChannel);
			expect(mockBulkDeleteMessagesWithIds).toHaveBeenCalledOnce();
			expect(mockBulkDeleteMessagesWithIds).toHaveBeenCalledWith(
				queueEntries.map(entry => entry.queueMessageId),
				queueChannel
			);
			expect(mockDeleteStoredEntriesForQueue).toHaveBeenCalledOnce();
		}
	);

	test("Does not clear the database when clearing messages fails", async () => {
		mockBulkDeleteMessagesWithIds.mockResolvedValueOnce(false); // something goes wrong

		await expect(restart.execute(context)).resolves.toBeUndefined(); // don't throw

		expect(mockDeleteStoredEntriesForQueue).not.toHaveBeenCalled(); // don't clear
	});
});
