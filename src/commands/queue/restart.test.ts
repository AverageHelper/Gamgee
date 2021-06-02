jest.mock("../../actions/messages");
jest.mock("../../actions/queue/useQueue");
jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../permissions");

import { bulkDeleteMessagesWithIds } from "../../actions/messages";
const mockBulkDeleteMessagesWithIds = bulkDeleteMessagesWithIds as jest.Mock;

import { useQueue } from "../../actions/queue/useQueue";
const mockUseQueue = useQueue as jest.Mock;

import getQueueChannel from "../../actions/queue/getQueueChannel";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

const mockGetAllEntries = jest.fn();
const mockQueueClear = jest.fn();

import type Discord from "discord.js";
import type { GuildedCommandContext } from "../Command";
import restart from "./restart";
import { useTestLogger } from "../../../tests/testUtils/logger";

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

		mockUseQueue.mockReturnValue({
			getAllEntries: mockGetAllEntries,
			clear: mockQueueClear
		});
		mockGetAllEntries.mockResolvedValue([]);
		mockQueueClear.mockResolvedValue(undefined);
	});

	test("does nothing when no queue is set up", async () => {
		mockGetQueueChannel.mockResolvedValue(null);

		await expect(restart.execute(context)).resolves.toBeUndefined();

		expect(mockReply).toHaveBeenCalledTimes(1);
		expect(mockReply).toHaveBeenCalledWith("No queue is set up. Maybe that's what you wanted...?");
		expect(mockUseQueue).not.toHaveBeenCalled();
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
			context.channel = ({
				id: channelId
			} as unknown) as Discord.TextChannel;

			await expect(restart.execute(context)).resolves.toBeUndefined();

			// Feedback
			expect(mockPrepareForLongRunningTasks).toHaveBeenCalledTimes(1);
			expect(mockReply).toHaveBeenCalledTimes(1);
			expect(mockReply).toHaveBeenCalledWith("The queue has restarted.");

			// Actions
			expect(mockUseQueue).toHaveBeenCalledTimes(1);
			expect(mockUseQueue).toHaveBeenCalledWith(queueChannel);
			expect(mockBulkDeleteMessagesWithIds).toHaveBeenCalledTimes(1);
			expect(mockBulkDeleteMessagesWithIds).toHaveBeenCalledWith(
				queueEntries.map(entry => entry.queueMessageId),
				queueChannel
			);
			expect(mockQueueClear).toHaveBeenCalledTimes(1);
		}
	);
});
