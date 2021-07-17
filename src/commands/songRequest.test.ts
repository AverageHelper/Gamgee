jest.mock("../useGuildStorage");
jest.mock("../actions/queue/getQueueChannel");
jest.mock("../actions/queue/useQueue");
jest.mock("../actions/getVideoDetails");

import * as queueActions from "../actions/queue/useQueue";
const mockUseQueue = queueActions.useQueue as jest.Mock;

import * as guildStorage from "../useGuildStorage";
const mockGuildStorage = guildStorage.useGuildStorage as jest.Mock;

import getQueueChannel from "../actions/queue/getQueueChannel";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import getVideoDetails from "../actions/getVideoDetails";
const mockGetVideoDetails = getVideoDetails as jest.Mock;
mockGetVideoDetails.mockImplementation(async (url: string) => {
	// Enough uncertainty that *something* should go out of order if it's going to
	const ms = Math.floor(Math.random() * 50);
	await new Promise(resolve => setTimeout(resolve, ms));
	return {
		url,
		title: "video-title",
		duration: {
			seconds: 500
		},
		fromUrl: true
	};
});

import type { GuildedCommandContext } from "./Command";
import { useTestLogger } from "../../tests/testUtils/logger";
import Discord from "discord.js";
import songRequest from "./songRequest";

const logger = useTestLogger("error");

describe("Song request via URL", () => {
	const urls: [string, string, string, string, string, string, string, string, string, string] = [
		"https://youtu.be/dQw4w9WgXcQ",
		"https://youtu.be/9RAQsdTQIcs",
		"https://youtu.be/tao1Ic8qVkM",
		"https://youtu.be/sSukg-tAK1k",
		"https://youtu.be/9eWHXhLu-uM",
		"https://youtu.be/jeKH5HhmNQc",
		"https://youtu.be/NUYvbT6vTPs",
		"https://youtu.be/aekVhtK9yuQ",
		"https://youtu.be/BwyY5LdpECA",
		"https://youtu.be/7btMEX3kAPo"
	];
	const botId = "this-user";

	const mockPrepareForLongRunningTasks = jest.fn().mockResolvedValue(undefined);
	const mockReply = jest.fn().mockResolvedValue(undefined);
	const mockReplyPrivately = jest.fn().mockResolvedValue(undefined);
	const mockChannelSend = jest.fn().mockResolvedValue(undefined);
	const mockDeleteMessage = jest.fn().mockResolvedValue(undefined);
	const mockFollowUp = jest.fn().mockResolvedValue(undefined);

	const mockQueueGetLatestUserEntry = jest.fn().mockResolvedValue(null);
	const mockQueueUserEntryCount = jest.fn().mockResolvedValue(0);

	const mockQueuePush = jest.fn();

	mockGuildStorage.mockReturnValue({
		isQueueOpen: jest.fn().mockResolvedValue(true)
	});

	mockGetQueueChannel.mockResolvedValue({
		id: "queue-channel-123",
		name: "queue"
	});

	mockUseQueue.mockReturnValue({
		getConfig: jest.fn().mockResolvedValue({
			entryDurationSeconds: null,
			cooldownSeconds: 600,
			submissionMaxQuantity: null,
			blacklistedUsers: []
		}),
		push: mockQueuePush,
		getLatestEntryFrom: mockQueueGetLatestUserEntry,
		countFrom: mockQueueUserEntryCount
	});

	const mockClient: Discord.Client = ({ user: { id: botId } } as unknown) as Discord.Client;

	function mockMessage(senderId: string, content: string): Discord.Message {
		const mockSenderMember: Discord.GuildMember = ({
			user: { id: senderId }
		} as unknown) as Discord.GuildMember;

		return ({
			content,
			author: {
				bot: false,
				id: mockSenderMember.user.id,
				username: senderId
			},
			createdAt: new Date(),
			client: (mockClient as unknown) as Discord.Client,
			prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
			reply: mockReply,
			channel: {
				id: "request-channel-456",
				send: mockChannelSend
			},
			guild: {
				members: {
					fetch: jest.fn().mockImplementation(
						(userId: string) =>
							new Promise(resolve => {
								if (userId === mockSenderMember.user.id) {
									return resolve(mockSenderMember);
								} else if (userId === botId) {
									return resolve(mockClient);
								}
							})
					)
				}
			}
		} as unknown) as Discord.Message;
	}

	describe("Song request help", () => {
		test("descibes how to submit a song", async () => {
			const context = ({
				type: "message",
				guild: "any-guild",
				channel: "any-channel",
				user: "doesn't matter",
				options: new Discord.Collection(),
				logger,
				prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
				reply: mockReply,
				replyPrivately: mockReplyPrivately,
				deleteInvocation: mockDeleteMessage,
				followUp: mockFollowUp
			} as unknown) as GuildedCommandContext;

			await songRequest.execute(context);
			expect(mockReply).toHaveBeenCalledTimes(1);
			expect(mockReply).toHaveBeenCalledWith(expect.toBeString());

			const calls = mockReply.mock.calls[0] as Array<unknown>;
			const description = calls[0];
			expect(description).toMatchSnapshot();
		});
	});

	test("only a user's first submission gets in if a cooldown exists", async () => {
		const mockMessage1 = mockMessage("another-user", `?sr ${urls[0]}`);
		const mockMessage2 = mockMessage("another-user", `?sr ${urls[1]}`);

		mockQueuePush.mockImplementationOnce(() => {
			mockQueueGetLatestUserEntry.mockResolvedValueOnce({
				queueMessageId: mockMessage1.id,
				url: urls[0],
				seconds: 500,
				sentAt: new Date(),
				senderId: mockMessage1.author.id,
				isDone: false
			});
			mockQueueUserEntryCount.mockResolvedValueOnce(1);
			return Promise.resolve();
		});

		const context1 = ({
			guild: mockMessage1.guild,
			channel: mockMessage1.channel,
			user: mockMessage1.author,
			options: new Discord.Collection([
				[
					"url",
					{
						name: "url",
						value: urls[0]
					}
				]
			]),
			logger,
			prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
			reply: mockReply,
			replyPrivately: mockReplyPrivately,
			deleteInvocation: mockDeleteMessage,
			followUp: mockFollowUp
		} as unknown) as GuildedCommandContext;
		const context2 = ({
			...context1,
			options: new Discord.Collection([
				[
					"url",
					{
						name: "url",
						value: urls[1]
					}
				]
			]),
			user: mockMessage2.author,
			guild: mockMessage2.guild,
			channel: mockMessage2.channel
		} as unknown) as GuildedCommandContext;

		// Request a song twice in quick succession
		void songRequest.execute(context1);
		await songRequest.execute(context2);

		// Wait for handles to close
		await new Promise(resolve => setTimeout(resolve, 500));

		// queue.push should only have been called on the first URL
		expect(mockQueuePush).toHaveBeenCalledTimes(1);
		expect(mockQueuePush).toHaveBeenCalledWith(expect.toContainEntry(["url", urls[0]]));

		// The submission should have been rejected with a cooldown warning via DMs
		expect(mockDeleteMessage).toHaveBeenCalledTimes(1);
		expect(mockReplyPrivately).toHaveBeenCalledTimes(1);
		expect(mockReplyPrivately).toHaveBeenCalledWith(expect.stringContaining("must wait"));
	});

	test("submissions enter the queue in order", async () => {
		const mockMessages: Array<Discord.Message> = [];
		urls.forEach((url, i) => {
			const userId = `user-${i + 1}`;
			const message = mockMessage(userId, `?sr ${url}`);
			mockMessages.push(message);
		});

		await Promise.all([
			mockMessages
				.map(message => {
					return ({
						options: new Discord.Collection(
							message.content
								.split(" ")
								.slice(1)
								.map(url => ({
									name: "url",
									value: url
								}))
								.map(c => [c.name, c])
						),
						guild: message.guild,
						channel: message.channel,
						user: message.author,
						logger,
						prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
						reply: mockReply,
						replyPrivately: mockReplyPrivately,
						followUp: mockFollowUp
					} as unknown) as GuildedCommandContext;
				})
				.map(songRequest.execute)
		]);

		// Wait for handles to close
		await new Promise(resolve => setTimeout(resolve, 500));

		// queue.push should have been called on each URL
		urls.forEach((url, i) => {
			expect(mockQueuePush).toHaveBeenNthCalledWith(
				i + 1,
				expect.toContainEntries([
					["url", url],
					["senderId", `user-${i + 1}`]
				])
			);
		});
		expect(mockQueuePush).toHaveBeenCalledTimes(10);
	});
});
