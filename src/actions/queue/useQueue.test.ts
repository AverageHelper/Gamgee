jest.mock("../messages");
jest.mock("../../useQueueStorage");

import { getQueueConfig } from "../../useQueueStorage";
const mockGetQueueConfig = getQueueConfig as jest.Mock;

import { deleteMessage } from "../messages";
const mockDeleteMessage = deleteMessage as jest.Mock;

const mockFetchEntryFromMessage = jest.fn();
const mockRemoveEntryFromMessage = jest.fn();
const mockCreateEntry = jest.fn();

const mockChannelSend = jest.fn();
const mockMessageRemoveReaction = jest.fn();

import type Discord from "discord.js";
import type { QueueEntry, QueueEntryManager, UnsentQueueEntry } from "../../useQueueStorage";
import { flushPromises } from "../../../tests/testUtils/flushPromises";
import { forgetJobQueue } from "@averagehelper/job-queue";
import { QueueManager } from "./useQueue";

describe("Request Queue", () => {
	const guildId = "the-guild";
	const queueMessageId = "queue-message" as Discord.Snowflake;
	const entrySenderId = "some-user" as Discord.Snowflake;
	const entryUrl = "the-entry-url";

	let storage: QueueEntryManager;
	let queue: QueueManager;
	let queueChannel: Discord.TextChannel;
	let message: Discord.Message;
	let entry: QueueEntry;

	beforeEach(() => {
		queueChannel = ({
			id: "queue-channel",
			send: mockChannelSend
		} as unknown) as Discord.TextChannel;

		storage = ({
			fetchEntryFromMessage: mockFetchEntryFromMessage,
			removeEntryFromMessage: mockRemoveEntryFromMessage,
			create: mockCreateEntry
		} as unknown) as QueueEntryManager;

		queue = new QueueManager(storage, queueChannel);

		message = ({
			id: queueMessageId,
			channel: {
				id: "the-channel"
			},
			author: {
				id: entrySenderId
			},
			guild: {
				id: guildId
			}
		} as unknown) as Discord.Message;

		entry = ({
			senderId: entrySenderId,
			url: entryUrl
		} as unknown) as QueueEntry;

		forgetJobQueue(`${message.channel.id}_${message.id}`);

		mockFetchEntryFromMessage.mockImplementation(id => {
			if (id === queueMessageId) {
				return entry; // some entry
			}
			return null; // not an entry
		});
		mockRemoveEntryFromMessage.mockResolvedValue(undefined);
		mockCreateEntry.mockImplementation((entry: UnsentQueueEntry) => {
			return Promise.resolve({ ...entry, channelId: queueChannel.id });
		});
		mockGetQueueConfig.mockResolvedValue({
			channelId: queueChannel.id,
			entryDurationSeconds: 430,
			cooldownSeconds: 960,
			submissionMaxQuantity: 3,
			blacklistedUsers: []
		});
		mockMessageRemoveReaction.mockResolvedValue(undefined);
		mockChannelSend.mockResolvedValue({
			id: "new-message",
			channel: {
				id: queueChannel.id
			}
		});
	});

	test("does nothing when a message has nothing to do with a queue entry", async () => {
		message.id = "not-a-queue-message" as Discord.Snowflake;
		await expect(queue.deleteEntryFromMessage(message)).resolves.toBeNull();

		expect(mockRemoveEntryFromMessage).not.toHaveBeenCalled();
		expect(mockDeleteMessage).not.toHaveBeenCalled();
	});

	test("deletes a queue entry based on a message", async () => {
		message.id = queueMessageId;
		await expect(queue.deleteEntryFromMessage(message)).resolves.toBe(entry);

		expect(mockRemoveEntryFromMessage).toHaveBeenCalledTimes(1);
		expect(mockRemoveEntryFromMessage).toHaveBeenCalledWith(message.id);
		expect(mockDeleteMessage).toHaveBeenCalledTimes(1);
		expect(mockDeleteMessage).toHaveBeenCalledWith(message);
	});

	const request: UnsentQueueEntry = {
		url: "song-url",
		seconds: 43,
		senderId: "sender" as Discord.Snowflake
	};

	test("stores queue entries", async () => {
		await expect(queue.push(request)).resolves.toContainEntries<Record<string, unknown>>([
			...Object.entries(request),
			["channelId", queueChannel.id]
		]);

		await flushPromises();

		expect(mockCreateEntry).toHaveBeenCalledTimes(1);
		expect(mockCreateEntry).toHaveBeenCalledWith({
			...request,
			isDone: false,
			sentAt: expect.toBeValidDate() as Date,
			queueMessageId: "new-message",
			haveCalledNowPlaying: [] as Array<Discord.Snowflake>
		});

		expect(mockRemoveEntryFromMessage).not.toHaveBeenCalled();
	});
});
