jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../useQueueStorage");
jest.mock("../../helpers/getUserFromMention");
jest.mock("../../permissions");

import { getUserFromMention } from "../../helpers/getUserFromMention.js";
const mockGetUserFromMention = getUserFromMention as jest.Mock;

import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { getQueueConfig, blacklistUser } from "../../useQueueStorage.js";
const mockGetQueueConfig = getQueueConfig as jest.Mock;
const mockBlacklistUser = blacklistUser as jest.Mock;

import type Discord from "discord.js";
import type { GuildedCommandContext } from "../Command.js";
import { ApplicationCommandOptionType } from "discord.js";
import { blacklist } from "./blacklist.js";
import { useTestLogger } from "../../../tests/testUtils/logger.js";

const mockReply = jest.fn().mockResolvedValue(undefined);
const mockDeleteMessage = jest.fn().mockResolvedValue(undefined);
const mockReplyPrivately = jest.fn().mockResolvedValue(undefined);

const logger = useTestLogger();

describe("Manage the Queue Blacklist", () => {
	const queueChannelId = "queue-channel";
	const queueChannel = { id: queueChannelId };

	const ownerId = "server-owner" as Discord.Snowflake;
	const badUserId = "bad-user";

	let context: GuildedCommandContext;

	beforeEach(() => {
		context = {
			type: "message",
			guild: {
				ownerId,
				name: "Test Guild"
			},
			user: { id: "test-user" },
			options: [
				{
					name: "user",
					value: `<@${badUserId}>`,
					type: ApplicationCommandOptionType.String
				}
			],
			logger,
			reply: mockReply,
			replyPrivately: mockReplyPrivately,
			deleteInvocation: mockDeleteMessage
		} as unknown as GuildedCommandContext;

		mockGetQueueChannel.mockResolvedValue(queueChannel);
		mockGetUserFromMention.mockResolvedValue({ id: badUserId });
		mockGetQueueConfig.mockResolvedValue({ blacklistedUsers: [] });

		mockBlacklistUser.mockResolvedValue(undefined);
		mockReply.mockResolvedValue(undefined);
		mockDeleteMessage.mockResolvedValue(undefined);
		mockReplyPrivately.mockResolvedValue(undefined);
	});

	describe("Listing Blacklisted Users", () => {
		test("reads off the list of blacklisted users when no user is provided (empty space)", async () => {
			context = { ...context, options: [] };
			await expect(blacklist.execute(context)).resolves.toBeUndefined();

			expect(mockBlacklistUser).not.toHaveBeenCalled();
			expect(mockReply).toHaveBeenCalledOnce();
			expect(mockReply).toHaveBeenCalledWith(expect.stringContaining("your DMs"));
			expect(mockReplyPrivately).toHaveBeenCalledWith(
				expect.stringContaining(`?sr ${blacklist.name} <user mention>`)
			);
		});

		test("reads off the list of blacklisted users when no user is provided (no further text)", async () => {
			context = { ...context, options: [] };
			await expect(blacklist.execute(context)).resolves.toBeUndefined();

			expect(mockBlacklistUser).not.toHaveBeenCalled();
			expect(mockReply).toHaveBeenCalledOnce(); // only called when not a '/' command
			expect(mockReply).toHaveBeenCalledWith(expect.stringContaining("your DMs"));
			expect(mockReplyPrivately).toHaveBeenCalledWith(
				expect.stringContaining(`?sr ${blacklist.name} <user mention>`)
			);
		});
	});

	describe("Adding Users", () => {
		test("does nothing against the calling user", async () => {
			mockGetUserFromMention.mockResolvedValue({ id: context.user.id });
			await expect(blacklist.execute(context)).resolves.toBeUndefined();

			expect(mockBlacklistUser).not.toHaveBeenCalled();
			expect(mockReply).toHaveBeenCalledOnce();
			expect(mockReply).toHaveBeenCalledWith(
				expect.objectContaining({
					content: expect.stringContaining("blacklist yourself") as string,
					ephemeral: true
				})
			);
		});

		test("does nothing against the server owner", async () => {
			mockGetUserFromMention.mockResolvedValue({ id: ownerId });
			await expect(blacklist.execute(context)).resolves.toBeUndefined();

			expect(mockBlacklistUser).not.toHaveBeenCalled();
			expect(mockReply).toHaveBeenCalledOnce();
			expect(mockReply).toHaveBeenCalledWith(
				expect.objectContaining({
					content: expect.stringContaining("blacklist the owner") as string,
					ephemeral: true
				})
			);
		});

		test("does nothing against the server owner, even when the owner is the caller", async () => {
			context.user.id = ownerId;
			mockGetUserFromMention.mockResolvedValue({ id: ownerId });
			await expect(blacklist.execute(context)).resolves.toBeUndefined();

			expect(mockBlacklistUser).not.toHaveBeenCalled();
			expect(mockReply).toHaveBeenCalledOnce();
			expect(mockReply).toHaveBeenCalledWith(
				expect.objectContaining({
					content: expect.stringContaining("blacklist yourself") as string,
					ephemeral: true
				})
			);
		});

		test("does nothing against a user not known to the guild", async () => {
			mockGetUserFromMention.mockResolvedValue(null);
			await expect(blacklist.execute(context)).resolves.toBeUndefined();

			expect(mockBlacklistUser).not.toHaveBeenCalled();
		});

		test("does nothing when there's no queue", async () => {
			mockGetQueueChannel.mockResolvedValueOnce(null);
			await expect(blacklist.execute(context)).resolves.toBeUndefined();

			expect(mockBlacklistUser).not.toHaveBeenCalled();
		});

		test("calls blacklistUser for queue", async () => {
			await expect(blacklist.execute(context)).resolves.toBeUndefined();

			// blacklist effect
			expect(mockBlacklistUser).toHaveBeenCalledOnce();
			expect(mockBlacklistUser).toHaveBeenCalledWith(badUserId, queueChannel);

			// response
			expect(mockReply).toHaveBeenCalledOnce();
			expect(mockReply).toHaveBeenCalledWith(
				expect.objectContaining({
					content: expect.stringContaining(badUserId) as string,
					shouldMention: false,
					ephemeral: true
				})
			);
			expect(mockDeleteMessage).toHaveBeenCalledOnce();
			expect(mockDeleteMessage).toHaveBeenCalledWith();
		});
	});
});
