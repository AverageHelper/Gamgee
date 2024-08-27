import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../actions/queue/getQueueChannel.js");
vi.mock("../../useQueueStorage.js");
vi.mock("../../actions/queue/useQueue.js");

import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as Mock<typeof getQueueChannel>;

import { countAllStoredEntries } from "../../useQueueStorage.js";
const mockCountAllStoredEntries = countAllStoredEntries as Mock<typeof countAllStoredEntries>;

import {
	playtimeAverageInQueue,
	playtimeRemainingInQueue,
	playtimeTotalInQueue,
} from "../../actions/queue/useQueue.js";
const mockPlaytimeRemaining = playtimeRemainingInQueue as Mock<typeof playtimeRemainingInQueue>;
const mockPlaytimeTotal = playtimeTotalInQueue as Mock<typeof playtimeTotalInQueue>;
const mockPlaytimeAverage = playtimeAverageInQueue as Mock<typeof playtimeAverageInQueue>;

import type { GuildedCommandContext } from "../CommandContext.js";
import type { TextChannel } from "discord.js";
import { stats } from "./stats.js";
import { useTestLogger } from "../../../tests/testUtils/logger.js";

const logger = useTestLogger();

const mockReply = vi.fn().mockResolvedValue(undefined);
const mockReplyPrivately = vi.fn().mockResolvedValue(undefined);
const mockDeleteInvocation = vi.fn().mockResolvedValue(undefined);

describe("Queue Statistics", () => {
	let context: GuildedCommandContext;

	beforeEach(() => {
		context = {
			guild: "the-guild",
			channel: undefined,
			logger,
			reply: mockReply,
			replyPrivately: mockReplyPrivately,
			deleteInvocation: mockDeleteInvocation,
		} as unknown as GuildedCommandContext;

		mockCountAllStoredEntries.mockResolvedValue(0);
		mockPlaytimeRemaining.mockResolvedValue(0);
		mockPlaytimeTotal.mockResolvedValue(0);
		mockPlaytimeAverage.mockResolvedValue(0);

		mockGetQueueChannel.mockResolvedValue({
			id: "queue-channel",
		} as unknown as TextChannel);
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
		expect(mockPlaytimeAverage).toHaveBeenCalledOnce();
		expect(mockPlaytimeRemaining).toHaveBeenCalledOnce();
		expect(mockPlaytimeTotal).toHaveBeenCalledOnce();
		expect(mockReplyPrivately).toHaveBeenCalledOnce();
	});
});
