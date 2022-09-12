jest.mock("../../actions/messages/index.js");
jest.mock("../getVideoDetails.js");
jest.mock("./useQueue.js");
jest.mock("../../useGuildStorage.js");
jest.mock("../../useQueueStorage.js");

// ** Gather mockable actions

import { deleteMessage } from "../../actions/messages/index.js";
const mockDeleteMessage = deleteMessage as jest.Mock<Promise<boolean>>;

import type { VideoDetails } from "../getVideoDetails.js";
import { getVideoDetails } from "../getVideoDetails.js";
const mockGetVideoDetails = getVideoDetails as jest.Mock<Promise<VideoDetails | null>>;

import { playtimeTotalInQueue, pushEntryToQueue } from "./useQueue.js";
const mockPlaytimeTotalInQueue = playtimeTotalInQueue as jest.Mock<Promise<number>>;
const mockPushEntryToQueue = pushEntryToQueue as jest.Mock<
	Promise<QueueEntry>,
	[UnsentQueueEntry, Discord.TextChannel]
>;

import type Discord from "discord.js";
import { isQueueOpen, setQueueOpen } from "../../useGuildStorage.js";
const mockIsQueueOpen = isQueueOpen as jest.Mock<Promise<boolean>, [Discord.Guild]>;
const mockSetQueueOpen = setQueueOpen as jest.Mock<Promise<void>, [boolean, Discord.Guild]>;

import {
	countAllEntriesFrom,
	fetchLatestEntryFrom,
	getQueueConfig
} from "../../useQueueStorage.js";
import type { UnsentQueueEntry } from "../../useQueueStorage.js";
const mockCountAllEntriesFrom = countAllEntriesFrom as jest.Mock<Promise<number>>;
const mockFetchLatestEntryFrom = fetchLatestEntryFrom as jest.Mock<Promise<QueueEntry | null>>;
const mockGetQueueConfig = getQueueConfig as jest.Mock<Promise<QueueConfig>>;

const mockDeleteInvocation = jest.fn();
const mockReplyPrivately = jest.fn();
const mockFollowUp = jest.fn();

const mockChannelSend = jest.fn() as jest.Mock<Promise<unknown>, [string]>;

// ** Import the unit-under-test

import type { CommandContext } from "../../commands/CommandContext.js";
import type { QueueConfig, QueueEntry } from "../../database/model/index.js";
import type { SongRequest } from "./processSongRequest.js";
import { processSongRequest } from "./processSongRequest.js";
import { URL } from "node:url";
import { useTestLogger } from "../../../tests/testUtils/logger.js";

describe("Song request pipeline", () => {
	let config: QueueConfig;
	let context: CommandContext;
	let request: SongRequest;
	let newEntry: QueueEntry;

	beforeEach(() => {
		// ** Reset mocks for each run

		const GUILD_ID = "the-guild-1234";
		const QUEUE_CHANNEL_ID = "queue-channel-1234";

		config = {
			blacklistedUsers: [],
			channelId: QUEUE_CHANNEL_ID,
			cooldownSeconds: null,
			entryDurationMinSeconds: null,
			entryDurationSeconds: null,
			queueDurationSeconds: null,
			submissionMaxQuantity: null
		};

		context = {
			type: "message",
			deleteInvocation: mockDeleteInvocation,
			replyPrivately: mockReplyPrivately,
			followUp: mockFollowUp,
			message: { content: "This is a message object. Trust me, bro" },
			user: {
				id: "the-user"
			}
		} as unknown as CommandContext;

		request = {
			context,
			logger: useTestLogger(),
			publicPreemptiveResponse: null,
			queueChannel: {
				id: QUEUE_CHANNEL_ID,
				guild: {
					id: GUILD_ID
				} as unknown as Discord.Guild,
				send: mockChannelSend
			} as unknown as Discord.TextChannel,
			songUrl: new URL("https://localhost:9999/")
		};

		newEntry = {
			channelId: QUEUE_CHANNEL_ID,
			guildId: GUILD_ID,
			haveCalledNowPlaying: [],
			isDone: false,
			queueMessageId: "the-queue-message-1234",
			seconds: 1,
			senderId: context.user.id,
			sentAt: new Date(),
			url: request.songUrl.href
		};

		mockDeleteMessage.mockResolvedValue(true);
		mockGetVideoDetails.mockResolvedValue(null);
		mockPlaytimeTotalInQueue.mockResolvedValue(0);
		mockPushEntryToQueue.mockResolvedValue(newEntry);
		mockIsQueueOpen.mockResolvedValue(true);
		mockSetQueueOpen.mockResolvedValue(undefined);
		mockCountAllEntriesFrom.mockResolvedValue(0);
		mockFetchLatestEntryFrom.mockResolvedValue(null);
		mockGetQueueConfig.mockResolvedValue(config);
		mockDeleteInvocation.mockResolvedValue(undefined);
		mockReplyPrivately.mockResolvedValue(undefined);
		mockFollowUp.mockResolvedValue(undefined);
		mockChannelSend.mockResolvedValue(undefined);
	});

	test("closes the queue automatically just as entries exceed queue-length limits", async () => {
		// mock the queue limits to disable cooldown, enable long submissions, enable queue cap
		const entrySeconds = 100; // 3 of these should fill the queue
		config.queueDurationSeconds = 250;
		mockGetQueueConfig.mockResolvedValue(config);

		// mock the video getter to consider any URL to be really long
		mockGetVideoDetails.mockResolvedValue({
			title: "Long Song",
			duration: { seconds: entrySeconds },
			url: newEntry.url
		});

		// mock the queue closer so it behaves as tho the unit closed the queue appropriately
		let isQueueOpen = true;
		mockSetQueueOpen.mockImplementation(async toBeOpen => {
			isQueueOpen = toBeOpen;
			mockIsQueueOpen.mockResolvedValue(isQueueOpen);
			return await Promise.resolve(undefined);
		});

		// mock the queue appender so it tracks entry durations
		let queueDuration = 0;
		mockPushEntryToQueue.mockImplementation(async entry => {
			queueDuration += entry.seconds;
			mockPlaytimeTotalInQueue.mockResolvedValue(queueDuration);
			return await Promise.resolve(newEntry);
		});

		// These should fit, then close the queue
		await processSongRequest(request);
		await processSongRequest(request);
		await processSongRequest(request);

		expect(mockReplyPrivately).not.toHaveBeenCalled(); // no rejections yet

		// These should not fit now that the queue is closed
		await processSongRequest(request);
		await processSongRequest(request);

		// expect the queue close command to have been fired, and only 3 entries pushed
		expect(mockPushEntryToQueue).toHaveBeenCalledTimes(3); // 3 successful pushes
		expect(mockSetQueueOpen).toHaveBeenCalledOnce(); // 1 queue closure
		expect(mockSetQueueOpen).toHaveBeenCalledWith(false, request.queueChannel.guild);
		expect(mockReplyPrivately).toHaveBeenCalledTimes(2); // 2 rejections
	});
});
