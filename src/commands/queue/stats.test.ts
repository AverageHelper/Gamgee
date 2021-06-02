jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../actions/queue/useQueue");

import getQueueChannel from "../../actions/queue/getQueueChannel";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { useQueue } from "../../actions/queue/useQueue";
const mockUseQueue = useQueue as jest.Mock;

import type { GuildedCommandContext } from "../CommandContext";
import { useTestLogger } from "../../../tests/testUtils/logger";
import stats from "./stats";

const logger = useTestLogger();

const mockReply = jest.fn().mockResolvedValue(undefined);
const mockReplyPrivately = jest.fn().mockResolvedValue(undefined);
const mockDeleteInvocation = jest.fn().mockResolvedValue(undefined);

const mockCount = jest.fn();
const mockPlaytimeRemaining = jest.fn();
const mockPlaytimeTotal = jest.fn();

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

		mockGetQueueChannel.mockResolvedValue({
			id: "queue-channel"
		});
		mockUseQueue.mockReturnValue({
			count: mockCount,
			playtimeRemaining: mockPlaytimeRemaining,
			playtimeTotal: mockPlaytimeTotal
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
