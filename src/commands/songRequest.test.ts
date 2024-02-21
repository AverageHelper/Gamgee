import type { Mock } from "vitest";
import { describe, expect, test, vi } from "vitest";

vi.mock("../useGuildStorage.js");
vi.mock("../useQueueStorage.js");
vi.mock("../actions/queue/getQueueChannel.js");
vi.mock("../actions/queue/useQueue.js");
vi.mock("../actions/getVideoDetails.js");

import type { QueueEntry } from "../useQueueStorage.js";
import {
	countAllStoredEntriesFromSender,
	getLatestStoredEntryFromSender,
	getStoredQueueConfig,
} from "../useQueueStorage.js";
const mockCountAllStoredEntriesFromSender = countAllStoredEntriesFromSender as Mock<
	Parameters<typeof countAllStoredEntriesFromSender>,
	ReturnType<typeof countAllStoredEntriesFromSender>
>;
const mockGetStoredQueueConfig = getStoredQueueConfig as Mock<
	Parameters<typeof getStoredQueueConfig>,
	ReturnType<typeof getStoredQueueConfig>
>;
const mockGetLatestStoredEntryFromSender = getLatestStoredEntryFromSender as Mock<
	Parameters<typeof getLatestStoredEntryFromSender>,
	ReturnType<typeof getLatestStoredEntryFromSender>
>;

import { playtimeTotalInQueue, pushEntryToQueue } from "../actions/queue/useQueue.js";
const mockPlaytimeTotal = playtimeTotalInQueue as Mock<
	Parameters<typeof playtimeTotalInQueue>,
	ReturnType<typeof playtimeTotalInQueue>
>;
const mockQueuePush = pushEntryToQueue as Mock<
	Parameters<typeof pushEntryToQueue>,
	ReturnType<typeof pushEntryToQueue>
>;

import { getCommandPrefix, isQueueOpen } from "../useGuildStorage.js";
const mockGetCommandPrefix = getCommandPrefix as Mock<
	Parameters<typeof getCommandPrefix>,
	ReturnType<typeof getCommandPrefix>
>;
const mockIsQueueOpen = isQueueOpen as Mock<
	Parameters<typeof isQueueOpen>,
	ReturnType<typeof isQueueOpen>
>;

import { getQueueChannel } from "../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as Mock<
	Parameters<typeof getQueueChannel>,
	ReturnType<typeof getQueueChannel>
>;

import { randomInt } from "../helpers/randomInt.js";
import { getVideoDetails } from "../actions/getVideoDetails.js";
const mockGetVideoDetails = getVideoDetails as Mock<
	Parameters<typeof getVideoDetails>,
	ReturnType<typeof getVideoDetails>
>;
mockGetVideoDetails.mockImplementation(async url => {
	// Enough uncertainty that *something* should go out of order if it's going to
	const ms = randomInt(50);
	await new Promise(resolve => setTimeout(resolve, ms));
	return {
		url: typeof url === "string" ? url : url.href,
		title: "video-title",
		duration: {
			seconds: 500,
		},
	};
});

import type { Client, GuildMember, Message, TextChannel } from "discord.js";
import type { GuildedCommandContext } from "./Command.js";
import type { ReadonlyTuple } from "type-fest";
import { ApplicationCommandOptionType } from "discord.js";
import { DEFAULT_MESSAGE_COMMAND_PREFIX } from "../constants/database.js";
import { sr as songRequest } from "./songRequest.js";
import { useTestLogger } from "../../tests/testUtils/logger.js";

const logger = useTestLogger();

describe("Song request via URL", () => {
	const urls: ReadonlyTuple<URL, 10> = [
		new URL("https://youtu.be/dQw4w9WgXcQ"),
		new URL("https://youtu.be/9RAQsdTQIcs"),
		new URL("https://youtu.be/tao1Ic8qVkM"),
		new URL("https://youtu.be/sSukg-tAK1k"),
		new URL("https://youtu.be/9eWHXhLu-uM"),
		new URL("https://youtu.be/jeKH5HhmNQc"),
		new URL("https://youtu.be/NUYvbT6vTPs"),
		new URL("https://youtu.be/aekVhtK9yuQ"),
		new URL("https://youtu.be/BwyY5LdpECA"),
		new URL("https://youtu.be/7btMEX3kAPo"),
	];
	const botId = "this-user";

	const mockEditReply = vi.fn().mockResolvedValue(undefined);
	const mockPrepareForLongRunningTasks = vi.fn().mockResolvedValue(undefined);
	const mockReply = vi.fn().mockResolvedValue(undefined);
	const mockReplyPrivately = vi.fn().mockResolvedValue(undefined);
	const mockChannelSend = vi.fn().mockResolvedValue(undefined);
	const mockDeleteMessage = vi.fn().mockResolvedValue(undefined);
	const mockFollowUp = vi.fn().mockResolvedValue(undefined);

	mockGetLatestStoredEntryFromSender.mockResolvedValue(null);
	mockCountAllStoredEntriesFromSender.mockResolvedValue(0);

	mockPlaytimeTotal.mockResolvedValue(0);
	mockGetCommandPrefix.mockResolvedValue(DEFAULT_MESSAGE_COMMAND_PREFIX);
	mockIsQueueOpen.mockResolvedValue(true);

	const queueChannel = {
		id: "queue-channel-123",
		name: "queue",
	} as unknown as TextChannel;
	mockGetQueueChannel.mockResolvedValue(queueChannel);

	mockGetStoredQueueConfig.mockResolvedValue({
		blacklistedUsers: [],
		cooldownSeconds: 600,
		entryDurationMaxSeconds: null,
		queueDurationSeconds: null,
		submissionMaxQuantity: null,
		channelId: "",
		entryDurationMinSeconds: null,
	});

	const mockClient: Client<true> = {
		user: { id: botId },
	} as unknown as Client<true>;

	function mockMessage(senderId: string, content: string): Message {
		const mockSenderMember: GuildMember = {
			user: { id: senderId },
		} as unknown as GuildMember;

		return {
			content,
			author: {
				bot: false,
				id: mockSenderMember.user.id,
				username: senderId,
			},
			createdAt: new Date(),
			client: mockClient,
			prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
			reply: mockReply,
			channel: {
				id: "request-channel-456",
				send: mockChannelSend,
			},
			guild: {
				members: {
					fetch: vi.fn().mockImplementation(
						(userId: string) =>
							new Promise(resolve => {
								if (userId === mockSenderMember.user.id) {
									return resolve(mockSenderMember);
								} else if (userId === botId) {
									return resolve(mockClient);
								}
							}),
					),
				},
			},
		} as unknown as Message;
	}

	describe("Song request help", () => {
		test("descibes how to submit a song", async () => {
			const context = {
				type: "message",
				guild: "any-guild",
				channel: "any-channel",
				user: "doesn't matter",
				createdTimestamp: new Date(),
				options: [],
				logger,
				prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
				reply: mockReply,
				replyPrivately: mockReplyPrivately,
				deleteInvocation: mockDeleteMessage,
				followUp: mockFollowUp,
			} as unknown as GuildedCommandContext;

			await songRequest.execute(context);
			expect(mockReply).toHaveBeenCalledOnce();
			expect(mockReply).toHaveBeenCalledWith(expect.stringContaining(""));

			const calls = mockReply.mock.calls[0] as Array<unknown>;
			const description = calls[0];
			expect(description).toMatchSnapshot();
		});
	});

	test("only a user's first submission gets in if a cooldown exists", async () => {
		const mockMessage1 = mockMessage("another-user", `?sr ${urls[0].href}`);
		const mockMessage2 = mockMessage("another-user", `?sr ${urls[1].href}`);

		mockQueuePush.mockImplementationOnce(() => {
			const entry: QueueEntry = {
				queueMessageId: mockMessage1.id,
				url: urls[0].href,
				seconds: 500,
				sentAt: new Date(),
				senderId: mockMessage1.author.id,
				isDone: false,
				haveCalledNowPlaying: [],
				guildId: "",
				channelId: "",
			};
			mockGetLatestStoredEntryFromSender.mockResolvedValueOnce(entry);
			mockCountAllStoredEntriesFromSender.mockResolvedValueOnce(1);
			return Promise.resolve(entry);
		});

		const context1 = {
			guild: mockMessage1.guild,
			channel: mockMessage1.channel,
			user: mockMessage1.author,
			createdTimestamp: new Date(),
			options: [
				{
					name: "url",
					value: urls[0].href,
					type: ApplicationCommandOptionType.String,
				},
			],
			logger,
			prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
			reply: mockReply,
			replyPrivately: mockReplyPrivately,
			deleteInvocation: mockDeleteMessage,
			followUp: mockFollowUp,
		} as unknown as GuildedCommandContext;
		const context2 = {
			...context1,
			options: [
				{
					name: "url",
					value: urls[1].href,
					type: ApplicationCommandOptionType.String,
				},
			],
			user: mockMessage2.author,
			guild: mockMessage2.guild,
			channel: mockMessage2.channel,
		} as unknown as GuildedCommandContext;

		// Request a song twice in quick succession
		void songRequest.execute(context1);
		await songRequest.execute(context2);

		// Wait for handles to close
		await new Promise(resolve => setTimeout(resolve, 500));

		// queue.push should only have been called on the first URL
		expect(mockQueuePush).toHaveBeenCalledOnce();
		expect(mockQueuePush).toHaveBeenCalledWith(
			expect.objectContaining({ url: urls[0].href }),
			queueChannel,
		);

		// The submission should have been rejected with a cooldown warning via DMs
		expect(mockDeleteMessage).toHaveBeenCalledOnce();
		expect(mockReplyPrivately).toHaveBeenCalledOnce();
		expect(mockReplyPrivately).toHaveBeenCalledWith(expect.stringContaining("must wait") as string);
	});

	test("submissions enter the queue in order", async () => {
		const mockMessages: Array<Message> = [];
		for (const [i, url] of urls.entries()) {
			const userId = `user-${i + 1}`;
			const message = mockMessage(userId, `?sr ${url.href}`);
			mockMessages.push(message);
		}

		await Promise.all([
			mockMessages
				.map(message => {
					return {
						options: message.content
							.split(" ")
							.slice(1)
							.map(url => ({
								name: "url",
								value: url,
								type: ApplicationCommandOptionType.String,
							})),
						guild: message.guild,
						channel: message.channel,
						interaction: {
							editReply: mockEditReply,
						},
						user: message.author,
						createdTimestamp: new Date(),
						logger,
						prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
						reply: mockReply,
						replyPrivately: mockReplyPrivately,
						followUp: mockFollowUp,
					} as unknown as GuildedCommandContext;
				})
				.map(songRequest.execute),
		]);

		// Wait for handles to close
		await new Promise(resolve => setTimeout(resolve, 500));

		// queue.push should have been called on each URL
		for (const [i, url] of urls.entries()) {
			expect(mockQueuePush).toHaveBeenNthCalledWith(
				i + 1,
				expect.objectContaining({
					url: url.href,
					senderId: `user-${i + 1}`,
				}),
				queueChannel,
			);
		}
		expect(mockQueuePush).toHaveBeenCalledTimes(10);
	});
});
