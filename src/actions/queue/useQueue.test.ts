import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../messages/index.js");
vi.mock("../../useQueueStorage.js");

import {
	deleteStoredEntry,
	getStoredEntry,
	getStoredQueueConfig,
	saveNewEntryToDatabase
} from "../../useQueueStorage.js";
const mockDeleteStoredEntry = deleteStoredEntry as Mock<
	Parameters<typeof deleteStoredEntry>,
	ReturnType<typeof deleteStoredEntry>
>;
const mockGetStoredEntry = getStoredEntry as Mock<
	Parameters<typeof getStoredEntry>,
	ReturnType<typeof getStoredEntry>
>;
const mockGetStoredQueueConfig = getStoredQueueConfig as Mock<
	Parameters<typeof getStoredQueueConfig>,
	ReturnType<typeof getStoredQueueConfig>
>;
const mockSaveNewEntryToDatabase = saveNewEntryToDatabase as Mock<
	Parameters<typeof saveNewEntryToDatabase>,
	ReturnType<typeof saveNewEntryToDatabase>
>;

import { deleteMessage } from "../messages/index.js";
const mockDeleteMessage = deleteMessage as Mock<
	Parameters<typeof deleteMessage>,
	ReturnType<typeof deleteMessage>
>;

const mockChannelSend = vi.fn();
const mockMessageRemoveReaction = vi.fn();

import type { Guild, Message, Snowflake, TextChannel } from "discord.js";
import type { QueueEntry, UnsentQueueEntry } from "../../useQueueStorage.js";
import { flushPromises } from "../../../tests/testUtils/flushPromises.js";
import { forgetJobQueue } from "@averagehelper/job-queue";
import { DEFAULT_LOCALE } from "../../i18n.js";
import { deleteEntryFromMessage, pushEntryToQueue } from "./useQueue.js";

describe("Request Queue", () => {
	const guildId = "the-guild";
	const queueMessageId = "queue-message" as Snowflake;
	const entrySenderId = "some-user" as Snowflake;
	const entryUrl = "the-entry-url";

	let queueChannel: TextChannel;
	let message: Message;
	let entry: QueueEntry;

	beforeEach(() => {
		const guild = {
			id: guildId,
			preferredLocale: DEFAULT_LOCALE
		} as unknown as Guild;

		queueChannel = {
			id: "queue-channel",
			guild,
			send: mockChannelSend
		} as unknown as TextChannel;

		message = {
			id: queueMessageId,
			channel: {
				id: "the-channel"
			},
			author: {
				id: entrySenderId
			},
			guild
		} as unknown as Message;

		entry = {
			senderId: entrySenderId,
			url: entryUrl
		} as unknown as QueueEntry;

		forgetJobQueue(`${message.channel.id}_${message.id}`);

		mockGetStoredEntry.mockImplementation(id => {
			if (id === queueMessageId) {
				return Promise.resolve(entry); // some entry
			}
			return Promise.resolve(null); // not an entry
		});
		mockDeleteStoredEntry.mockResolvedValue(undefined);
		mockSaveNewEntryToDatabase.mockImplementation(entry => {
			return Promise.resolve({
				channelId: queueChannel.id,
				queueMessageId: entry.queueMessageId,
				url: entry.url,
				seconds: entry.seconds,
				sentAt: entry.sentAt,
				senderId: entry.senderId,
				isDone: entry.isDone,
				haveCalledNowPlaying: [],
				guildId: ""
			});
		});
		mockGetStoredQueueConfig.mockResolvedValue({
			blacklistedUsers: [],
			channelId: queueChannel.id,
			cooldownSeconds: 960,
			entryDurationMaxSeconds: 430,
			entryDurationMinSeconds: 0,
			submissionMaxQuantity: 3,
			queueDurationSeconds: null
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
		message.id = "not-a-queue-message" as Snowflake;
		await expect(deleteEntryFromMessage(message)).resolves.toBeNull();

		expect(mockDeleteStoredEntry).not.toHaveBeenCalled();
		expect(mockDeleteMessage).not.toHaveBeenCalled();
	});

	test("deletes a queue entry based on a message", async () => {
		message.id = queueMessageId;
		await expect(deleteEntryFromMessage(message)).resolves.toBe(entry);

		expect(mockDeleteStoredEntry).toHaveBeenCalledOnce();
		expect(mockDeleteStoredEntry).toHaveBeenCalledWith(message.id);
		expect(mockDeleteMessage).toHaveBeenCalledOnce();
		expect(mockDeleteMessage).toHaveBeenCalledWith(message);
	});

	const request: UnsentQueueEntry = {
		url: "song-url",
		seconds: 43,
		senderId: "sender" as Snowflake
	};

	test("stores queue entries", async () => {
		await expect(pushEntryToQueue(request, queueChannel)).resolves.toMatchObject({
			...request,
			channelId: queueChannel.id
		});

		await flushPromises();

		expect(mockSaveNewEntryToDatabase).toHaveBeenCalledOnce();
		expect(mockSaveNewEntryToDatabase).toHaveBeenCalledWith(
			{
				...request,
				isDone: false,
				// sentAt: expect.toBeValidDate() as Date, // TODO: Can we even assert these without `jest-extended`?
				sentAt: expect.any(Date) as Date,
				queueMessageId: "new-message"
			},
			queueChannel
		);

		expect(mockDeleteStoredEntry).not.toHaveBeenCalled();
	});
});
