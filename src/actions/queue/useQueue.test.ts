jest.mock("../messages");
jest.mock("../../useQueueStorage");

import {
	createEntry,
	fetchEntryFromMessage,
	getQueueConfig,
	removeEntryFromMessage
} from "../../useQueueStorage.js";
const mockCreateEntry = createEntry as jest.Mock;
const mockFetchEntryFromMessage = fetchEntryFromMessage as jest.Mock;
const mockGetQueueConfig = getQueueConfig as jest.Mock;
const mockRemoveEntryFromMessage = removeEntryFromMessage as jest.Mock;

import { deleteMessage } from "../messages/index.js";
const mockDeleteMessage = deleteMessage as jest.Mock;

const mockChannelSend = jest.fn();
const mockMessageRemoveReaction = jest.fn();

import type Discord from "discord.js";
import type { QueueEntry, UnsentQueueEntry } from "../../useQueueStorage.js";
import { flushPromises } from "../../../tests/testUtils/flushPromises.js";
import { forgetJobQueue } from "@averagehelper/job-queue";
import { DEFAULT_LOCALE } from "../../i18n.js";
import { deleteEntryFromMessage, pushEntryToQueue } from "./useQueue.js";

describe("Request Queue", () => {
	const guildId = "the-guild";
	const queueMessageId = "queue-message" as Discord.Snowflake;
	const entrySenderId = "some-user" as Discord.Snowflake;
	const entryUrl = "the-entry-url";

	let queueChannel: Discord.TextChannel;
	let message: Discord.Message;
	let entry: QueueEntry;

	beforeEach(() => {
		const guild = {
			id: guildId,
			preferredLocale: DEFAULT_LOCALE
		} as unknown as Discord.Guild;

		queueChannel = {
			id: "queue-channel",
			guild,
			send: mockChannelSend
		} as unknown as Discord.TextChannel;

		message = {
			id: queueMessageId,
			channel: {
				id: "the-channel"
			},
			author: {
				id: entrySenderId
			},
			guild
		} as unknown as Discord.Message;

		entry = {
			senderId: entrySenderId,
			url: entryUrl
		} as unknown as QueueEntry;

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
		await expect(deleteEntryFromMessage(message, queueChannel)).resolves.toBeNull();

		expect(mockRemoveEntryFromMessage).not.toHaveBeenCalled();
		expect(mockDeleteMessage).not.toHaveBeenCalled();
	});

	test("deletes a queue entry based on a message", async () => {
		message.id = queueMessageId;
		await expect(deleteEntryFromMessage(message, queueChannel)).resolves.toBe(entry);

		expect(mockRemoveEntryFromMessage).toHaveBeenCalledOnce();
		expect(mockRemoveEntryFromMessage).toHaveBeenCalledWith(message.id, queueChannel);
		expect(mockDeleteMessage).toHaveBeenCalledOnce();
		expect(mockDeleteMessage).toHaveBeenCalledWith(message);
	});

	const request: UnsentQueueEntry = {
		url: "song-url",
		seconds: 43,
		senderId: "sender" as Discord.Snowflake
	};

	test("stores queue entries", async () => {
		await expect(pushEntryToQueue(request, queueChannel)).resolves.toContainEntries<
			Record<string, unknown>
		>([
			...Object.entries(request), //
			["channelId", queueChannel.id]
		]);

		await flushPromises();

		expect(mockCreateEntry).toHaveBeenCalledOnce();
		expect(mockCreateEntry).toHaveBeenCalledWith(
			{
				...request,
				isDone: false,
				sentAt: expect.toBeValidDate() as Date,
				queueMessageId: "new-message",
				haveCalledNowPlaying: [] as Array<Discord.Snowflake>
			},
			queueChannel
		);

		expect(mockRemoveEntryFromMessage).not.toHaveBeenCalled();
	});
});
