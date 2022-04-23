jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../useQueueStorage");
jest.mock("../../actions/queue/useQueue");

import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { countAllEntries } from "../../useQueueStorage.js";
const mockCount = countAllEntries as jest.Mock;

import {
	playtimeAverageInQueue,
	playtimeRemainingInQueue,
	playtimeTotalInQueue
} from "../../actions/queue/useQueue.js";
const mockPlaytimeRemaining = playtimeRemainingInQueue as jest.Mock;
const mockPlaytimeTotal = playtimeTotalInQueue as jest.Mock;
const mockPlaytimeAverage = playtimeAverageInQueue as jest.Mock;

import type { GuildedCommandContext } from "../CommandContext.js";
import { stats } from "./stats.js";
import { useTestLogger } from "../../../tests/testUtils/logger.js";

const logger = useTestLogger();

const mockReply = jest.fn().mockResolvedValue(undefined);
const mockReplyPrivately = jest.fn().mockResolvedValue(undefined);
const mockDeleteInvocation = jest.fn().mockResolvedValue(undefined);

describe("Queue Statistics", () => {
	let context: GuildedCommandContext;

	beforeEach(() => {
		context = ({
			guild: "the-guild",
			channel: undefined,
			logger,
			reply: mockReply,
			replyPrivately: mockReplyPrivately,
			deleteInvocation: mockDeleteInvocation
		} as unknown) as GuildedCommandContext;

		mockCount.mockResolvedValue(0);
		mockPlaytimeRemaining.mockResolvedValue(0);
		mockPlaytimeTotal.mockResolvedValue(0);
		mockPlaytimeAverage.mockResolvedValue(0);

		mockGetQueueChannel.mockResolvedValue({
			id: "queue-channel"
		});
	});

	test("does nothing when the guild has no queue", async () => {
		mockGetQueueChannel.mockResolvedValue(null);
		await expect(stats.execute(context)).resolves.toBeUndefined();
		expect(mockPlaytimeAverage).not.toHaveBeenCalled();
		expect(mockPlaytimeRemaining).not.toHaveBeenCalled();
		expect(mockPlaytimeTotal).not.toHaveBeenCalled();
	});

	test("displays queue statistics to the user", async () => {
		await expect(stats.execute(context)).resolves.toBeUndefined();
		expect(mockPlaytimeAverage).toHaveBeenCalledTimes(1);
		expect(mockPlaytimeRemaining).toHaveBeenCalledTimes(1);
		expect(mockPlaytimeTotal).toHaveBeenCalledTimes(1);
		expect(mockReplyPrivately).toHaveBeenCalledTimes(1);
	});
});
