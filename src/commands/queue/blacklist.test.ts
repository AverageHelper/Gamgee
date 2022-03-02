jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../useQueueStorage");
jest.mock("../../helpers/getUserFromMention");
jest.mock("../../permissions");

import getUserFromMention from "../../helpers/getUserFromMention";
const mockGetUserFromMention = getUserFromMention as jest.Mock;

import getQueueChannel from "../../actions/queue/getQueueChannel";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { getQueueConfig, useQueueStorage } from "../../useQueueStorage";
const mockGetQueueConfig = getQueueConfig as jest.Mock;
const mockUseQueueStorage = useQueueStorage as jest.Mock;

import type { QueueEntryManager } from "../../useQueueStorage";
import type { GuildedCommandContext } from "../Command";
import { useTestLogger } from "../../../tests/testUtils/logger";
import Discord from "discord.js";
import blacklist from "./blacklist";

const mockBlacklistUser = jest.fn();
const mockReply = jest.fn().mockResolvedValue(undefined);
const mockDeleteMessage = jest.fn().mockResolvedValue(undefined);
const mockReplyPrivately = jest.fn().mockResolvedValue(undefined);

const logger = useTestLogger("error");

describe("Manage the Queue Blacklist", () => {
	const queueChannelId = "queue-channel";

	const ownerId = "server-owner" as Discord.Snowflake;
	const badUserId = "bad-user";
	const mockClient: Discord.Client = ({} as unknown) as Discord.Client;

	let context: GuildedCommandContext;
	let queue: QueueEntryManager;

	beforeEach(() => {
		context = ({
			type: "message",
			guild: {
				ownerId,
				name: "Test Guild"
			},
			user: { id: "test-user" },
			options: new Discord.CommandInteractionOptionResolver(mockClient, [
				{
					name: "user",
					value: `<@${badUserId}>`,
					type: "STRING"
				}
			]),
			logger,
			reply: mockReply,
			replyPrivately: mockReplyPrivately,
			deleteInvocation: mockDeleteMessage
		} as unknown) as GuildedCommandContext;

		queue = ({
			blacklistUser: mockBlacklistUser
		} as unknown) as QueueEntryManager;

		mockGetQueueChannel.mockResolvedValue({ id: queueChannelId });
		mockGetUserFromMention.mockResolvedValue({ id: badUserId });
		mockGetQueueConfig.mockResolvedValue({ blacklistedUsers: [] });

		mockUseQueueStorage.mockReturnValue(queue);
		mockBlacklistUser.mockResolvedValue(undefined);
		mockReply.mockResolvedValue(undefined);
		mockDeleteMessage.mockResolvedValue(undefined);
		mockReplyPrivately.mockResolvedValue(undefined);
	});

	describe("Listing Blacklisted Users", () => {
		test("reads off the list of blacklisted users when no user is provided (empty space)", async () => {
			context.options = new Discord.CommandInteractionOptionResolver(mockClient, []);
			await expect(blacklist.execute(context)).resolves.toBeUndefined();

			expect(mockBlacklistUser).not.toHaveBeenCalled();
			expect(mockReply).toHaveBeenCalledTimes(1);
			expect(mockReply).toHaveBeenCalledWith(expect.stringContaining("your DMs"));
			expect(mockReplyPrivately).toHaveBeenCalledWith(
				expect.stringContaining(`?sr ${blacklist.name} <user mention>`)
			);
		});

		test("reads off the list of blacklisted users when no user is provided (no further text)", async () => {
			context.options = new Discord.CommandInteractionOptionResolver(mockClient, []);
			await expect(blacklist.execute(context)).resolves.toBeUndefined();

			expect(mockBlacklistUser).not.toHaveBeenCalled();
			expect(mockReply).toHaveBeenCalledTimes(1); // only called when not a '/' command
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
			expect(mockReply).toHaveBeenCalledTimes(1);
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
			expect(mockReply).toHaveBeenCalledTimes(1);
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
			expect(mockReply).toHaveBeenCalledTimes(1);
			expect(mockReply).toHaveBeenCalledWith(
				expect.objectContaining({
					content: expect.stringContaining("blacklist yourself") as string,
					ephemeral: true
				})
			);
		});

		test("does nothing against a user not known to the guild", async () => {
			mockGetUserFromMention.mockResolvedValue(undefined);
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
			expect(mockBlacklistUser).toHaveBeenCalledTimes(1);
			expect(mockBlacklistUser).toHaveBeenCalledWith(badUserId);

			// response
			expect(mockReply).toHaveBeenCalledTimes(1);
			expect(mockReply).toHaveBeenCalledWith(
				expect.objectContaining({
					content: expect.stringContaining(badUserId) as string,
					shouldMention: false,
					ephemeral: true
				})
			);
			expect(mockDeleteMessage).toHaveBeenCalledTimes(1);
			expect(mockDeleteMessage).toHaveBeenCalledWith();
		});
	});
});
