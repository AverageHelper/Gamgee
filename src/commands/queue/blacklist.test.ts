import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../actions/queue/getQueueChannel.js");
vi.mock("../../useQueueStorage.js");
vi.mock("../../helpers/getUserFromMention.js");
vi.mock("../../permissions/index.js");

import { getUserFromMention } from "../../helpers/getUserFromMention.js";
const mockGetUserFromMention = getUserFromMention as Mock<typeof getUserFromMention>;

import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as Mock<typeof getQueueChannel>;

import { getStoredQueueConfig, saveUserToStoredBlacklist } from "../../useQueueStorage.js";
const mockGetStoredQueueConfig = getStoredQueueConfig as Mock<typeof getStoredQueueConfig>;
const mockSaveUserToStoredBlacklist = saveUserToStoredBlacklist as Mock<
	typeof saveUserToStoredBlacklist
>;

import type { GuildedCommandContext } from "../Command.js";
import type { Snowflake, TextChannel, User } from "discord.js";
import { ApplicationCommandOptionType, userMention } from "discord.js";
import { blacklist } from "./blacklist.js";
import { useTestLogger } from "../../../tests/testUtils/logger.js";

const mockReply = vi.fn().mockResolvedValue(undefined);
const mockDeleteMessage = vi.fn().mockResolvedValue(undefined);
const mockReplyPrivately = vi.fn().mockResolvedValue(undefined);

const logger = useTestLogger();

describe("Manage the Queue Blacklist", () => {
	const queueChannelId = "queue-channel";
	const queueChannel = { id: queueChannelId } as unknown as TextChannel;

	const ownerId = "server-owner" as Snowflake;
	const badUserId = "bad-user";

	let context: GuildedCommandContext;

	beforeEach(() => {
		context = {
			type: "message",
			guild: {
				ownerId,
				name: "Test Guild",
			},
			user: { id: "test-user" },
			options: [
				{
					name: "user",
					value: userMention(badUserId),
					type: ApplicationCommandOptionType.String,
				},
			],
			logger,
			reply: mockReply,
			replyPrivately: mockReplyPrivately,
			deleteInvocation: mockDeleteMessage,
		} as unknown as GuildedCommandContext;

		mockGetQueueChannel.mockResolvedValue(queueChannel);
		mockGetUserFromMention.mockResolvedValue({ id: badUserId } as unknown as User);
		mockGetStoredQueueConfig.mockResolvedValue({
			blacklistedUsers: [],
			channelId: "",
			cooldownSeconds: null,
			submissionMaxQuantity: null,
			queueDurationSeconds: null,
			entryDurationMaxSeconds: null,
			entryDurationMinSeconds: null,
		});

		mockSaveUserToStoredBlacklist.mockResolvedValue(undefined);
		mockReply.mockResolvedValue(undefined);
		mockDeleteMessage.mockResolvedValue(undefined);
		mockReplyPrivately.mockResolvedValue(undefined);
	});

	describe("Listing Blacklisted Users", () => {
		test("reads off the list of blacklisted users when no user is provided (empty space)", async () => {
			context = { ...context, options: [] };
			await expect(blacklist.execute(context)).resolves.toBeUndefined();

			expect(mockSaveUserToStoredBlacklist).not.toHaveBeenCalled();
			expect(mockReply).toHaveBeenCalledExactlyOnceWith(expect.stringContaining("your DMs"));
			expect(mockReplyPrivately).toHaveBeenCalledWith(
				expect.stringContaining(`?quo ${blacklist.name} <user mention>`),
			);
		});

		test("reads off the list of blacklisted users when no user is provided (no further text)", async () => {
			context = { ...context, options: [] };
			await expect(blacklist.execute(context)).resolves.toBeUndefined();

			expect(mockSaveUserToStoredBlacklist).not.toHaveBeenCalled();
			expect(mockReply).toHaveBeenCalledExactlyOnceWith(expect.stringContaining("your DMs")); // only called when not a '/' command
			expect(mockReplyPrivately).toHaveBeenCalledWith(
				expect.stringContaining(`?quo ${blacklist.name} <user mention>`),
			);
		});
	});

	describe("Adding Users", () => {
		test("does nothing against the calling user", async () => {
			mockGetUserFromMention.mockResolvedValue({ id: context.user.id } as unknown as User);
			await expect(blacklist.execute(context)).resolves.toBeUndefined();

			expect(mockSaveUserToStoredBlacklist).not.toHaveBeenCalled();
			expect(mockReply).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({
					content: expect.stringContaining("blacklist yourself") as string,
					ephemeral: true,
				}),
			);
		});

		test("does nothing against the server owner", async () => {
			mockGetUserFromMention.mockResolvedValue({ id: ownerId } as unknown as User);
			await expect(blacklist.execute(context)).resolves.toBeUndefined();

			expect(mockSaveUserToStoredBlacklist).not.toHaveBeenCalled();
			expect(mockReply).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({
					content: expect.stringContaining("blacklist the owner") as string,
					ephemeral: true,
				}),
			);
		});

		test("does nothing against the server owner, even when the owner is the caller", async () => {
			context.user.id = ownerId;
			mockGetUserFromMention.mockResolvedValue({ id: ownerId } as unknown as User);
			await expect(blacklist.execute(context)).resolves.toBeUndefined();

			expect(mockSaveUserToStoredBlacklist).not.toHaveBeenCalled();
			expect(mockReply).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({
					content: expect.stringContaining("blacklist yourself") as string,
					ephemeral: true,
				}),
			);
		});

		test("does nothing against a user not known to the guild", async () => {
			mockGetUserFromMention.mockResolvedValue(null);
			await expect(blacklist.execute(context)).resolves.toBeUndefined();

			expect(mockSaveUserToStoredBlacklist).not.toHaveBeenCalled();
		});

		test("does nothing when there's no queue", async () => {
			mockGetQueueChannel.mockResolvedValueOnce(null);
			await expect(blacklist.execute(context)).resolves.toBeUndefined();

			expect(mockSaveUserToStoredBlacklist).not.toHaveBeenCalled();
		});

		test("calls blacklistUser for queue", async () => {
			await expect(blacklist.execute(context)).resolves.toBeUndefined();

			// blacklist effect
			expect(mockSaveUserToStoredBlacklist).toHaveBeenCalledExactlyOnceWith(
				badUserId,
				queueChannel,
			);

			// response
			expect(mockReply).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({
					content: expect.stringContaining(badUserId) as string,
					shouldMention: false,
					ephemeral: true,
				}),
			);
			expect(mockDeleteMessage).toHaveBeenCalledExactlyOnceWith();
		});
	});
});
