jest.mock("../../actions/messages");
jest.mock("../../actions/queue/useQueue");
jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../useQueueStorage");
jest.mock("../../permissions");

import { bulkDeleteMessagesWithIds } from "../../actions/messages/index.js";
const mockBulkDeleteMessagesWithIds = bulkDeleteMessagesWithIds as jest.Mock;

import { fetchAllEntries, clearEntries } from "../../useQueueStorage.js";
const mockGetAllEntries = fetchAllEntries as jest.Mock;
const mockQueueClear = clearEntries as jest.Mock;

import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import type Discord from "discord.js";
import type { GuildedCommandContext } from "../Command.js";
import { restart } from "./restart.js";
import { useTestLogger } from "../../../tests/testUtils/logger.js";

const mockPrepareForLongRunningTasks = jest.fn().mockResolvedValue(undefined);
const mockReply = jest.fn().mockResolvedValue(undefined);

const logger = useTestLogger("error");

describe("Clear queue contents", () => {
	let context: GuildedCommandContext;

	beforeEach(() => {
		context = ({
			logger,
			guild: "the guild",
			prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
			reply: mockReply
		} as unknown) as GuildedCommandContext;

		mockGetAllEntries.mockResolvedValue([]);
		mockQueueClear.mockResolvedValue(undefined);
		mockBulkDeleteMessagesWithIds.mockResolvedValue(true);
	});

	test("does nothing when no queue is set up", async () => {
		mockGetQueueChannel.mockResolvedValue(null);

		await expect(restart.execute(context)).resolves.toBeUndefined();

		expect(mockReply).toHaveBeenCalledTimes(1);
		expect(mockReply).toHaveBeenCalledWith("No queue is set up. Maybe that's what you wanted...?");
		expect(mockQueueClear).not.toHaveBeenCalled();
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
			mockGetAllEntries.mockResolvedValue(queueEntries);
			context = {
				...context,
				channel: ({
					id: channelId
				} as unknown) as Discord.TextChannel
			};

			await expect(restart.execute(context)).resolves.toBeUndefined();

			// Feedback
			expect(mockPrepareForLongRunningTasks).toHaveBeenCalledTimes(1);
			expect(mockReply).toHaveBeenCalledTimes(1);
			expect(mockReply).toHaveBeenCalledWith("The queue has restarted.");

			// Actions
			expect(mockQueueClear).toHaveBeenCalledTimes(1);
			expect(mockQueueClear).toHaveBeenCalledWith(queueChannel);
			expect(mockBulkDeleteMessagesWithIds).toHaveBeenCalledTimes(1);
			expect(mockBulkDeleteMessagesWithIds).toHaveBeenCalledWith(
				queueEntries.map(entry => entry.queueMessageId),
				queueChannel
			);
			expect(mockQueueClear).toHaveBeenCalledTimes(1);
		}
	);

	test("Does not clear the database when clearing messages fails", async () => {
		mockBulkDeleteMessagesWithIds.mockResolvedValueOnce(false); // something goes wrong

		await expect(restart.execute(context)).resolves.toBeUndefined(); // don't throw

		expect(mockQueueClear).not.toHaveBeenCalled(); // don't clear
	});
});
