jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../useQueueStorage");
jest.mock("../../actions/queue/useQueue");

import getQueueChannel from "../../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { countAllEntries } from "../../useQueueStorage.js";
const mockCount = countAllEntries as jest.Mock;

import { useQueue } from "../../actions/queue/useQueue.js";
const mockUseQueue = useQueue as jest.Mock;

import type { GuildedCommandContext } from "../CommandContext.js";
import { useTestLogger } from "../../../tests/testUtils/logger.js";
import stats from "./stats.js";

const logger = useTestLogger();

const mockReply = jest.fn().mockResolvedValue(undefined);
const mockReplyPrivately = jest.fn().mockResolvedValue(undefined);
const mockDeleteInvocation = jest.fn().mockResolvedValue(undefined);

const mockPlaytimeRemaining = jest.fn();
const mockPlaytimeTotal = jest.fn();
const mockPlaytimeAverage = jest.fn();

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
		mockUseQueue.mockReturnValue({
			playtimeRemaining: mockPlaytimeRemaining,
			playtimeTotal: mockPlaytimeTotal,
			playtimeAverage: mockPlaytimeAverage
		});
	});

	test("does nothing when the guild has no queue", async () => {
		mockGetQueueChannel.mockResolvedValue(null);
		await expect(stats.execute(context)).resolves.toBeUndefined();
		expect(mockUseQueue).not.toHaveBeenCalled();
	});

	test("displays queue statistics to the user", async () => {
		await expect(stats.execute(context)).resolves.toBeUndefined();
		expect(mockUseQueue).toHaveBeenCalledTimes(1);
		expect(mockReplyPrivately).toHaveBeenCalledTimes(1);
	});
});
