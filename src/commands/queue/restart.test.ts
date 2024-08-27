import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../actions/messages/index.js");
vi.mock("../../actions/queue/useQueue.js");
vi.mock("../../actions/queue/getQueueChannel.js");
vi.mock("../../useQueueStorage.js");
vi.mock("../../permissions/index.js");

import { bulkDeleteMessagesWithIds } from "../../actions/messages/index.js";
const mockBulkDeleteMessagesWithIds = bulkDeleteMessagesWithIds as Mock<
	typeof bulkDeleteMessagesWithIds
>;

import type { QueueEntry } from "../../useQueueStorage.js";
import { deleteStoredEntriesForQueue, getAllStoredEntries } from "../../useQueueStorage.js";
const mockDeleteStoredEntriesForQueue = deleteStoredEntriesForQueue as Mock<
	typeof deleteStoredEntriesForQueue
>;
const mockGetAllStoredEntries = getAllStoredEntries as Mock<typeof getAllStoredEntries>;

import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as Mock<typeof getQueueChannel>;

import type { GuildedCommandContext } from "../Command.js";
import type { TextChannel } from "discord.js";
import { restart } from "./restart.js";
import { useTestLogger } from "../../../tests/testUtils/logger.js";

const mockPrepareForLongRunningTasks = vi.fn().mockResolvedValue(undefined);
const mockReply = vi.fn().mockResolvedValue(undefined);

const logger = useTestLogger();

describe("Clear queue contents", () => {
	let context: GuildedCommandContext;

	beforeEach(() => {
		context = {
			logger,
			guild: "the guild",
			prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
			reply: mockReply,
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
			const queueChannel = { id: "queue-channel" } as unknown as TextChannel;
			const queueEntries = [
				{ queueMessageId: "message1" } as unknown as QueueEntry,
				{ queueMessageId: "message2" } as unknown as QueueEntry,
				{ queueMessageId: "message3" } as unknown as QueueEntry,
			];
			mockGetQueueChannel.mockResolvedValue(queueChannel);
			mockGetAllStoredEntries.mockResolvedValue(queueEntries);
			context = {
				...context,
				channel: {
					id: channelId,
				} as unknown as TextChannel,
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
				queueChannel,
			);
			expect(mockDeleteStoredEntriesForQueue).toHaveBeenCalledOnce();
		},
	);

	test("Does not clear the database when clearing messages fails", async () => {
		mockBulkDeleteMessagesWithIds.mockResolvedValueOnce(false); // something goes wrong

		await expect(restart.execute(context)).resolves.toBeUndefined(); // don't throw

		expect(mockDeleteStoredEntriesForQueue).not.toHaveBeenCalled(); // don't clear
	});
});
