import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../actions/queue/getQueueChannel.js");
vi.mock("../../useQueueStorage.js");
vi.mock("../../helpers/getUserFromMention.js");

import { getUserFromMention } from "../../helpers/getUserFromMention.js";
const mockGetUserFromMention = getUserFromMention as Mock<typeof getUserFromMention>;

import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as Mock<typeof getQueueChannel>;

import { removeUserFromStoredBlacklist } from "../../useQueueStorage.js";
const mockRemoveUserFromStoredBlacklist = removeUserFromStoredBlacklist as Mock<
	typeof removeUserFromStoredBlacklist
>;

import type { GuildedCommandContext } from "../Command.js";
import { ApplicationCommandOptionType, TextChannel, User, userMention } from "discord.js";
import { useTestLogger } from "../../../tests/testUtils/logger.js";
import { whitelist } from "./whitelist.js";

const mockReply = vi.fn().mockResolvedValue(undefined);
const mockDeleteMessage = vi.fn().mockResolvedValue(undefined);

const logger = useTestLogger();

describe("Removing from Queue Blacklist", () => {
	const queueChannelId = "queue-channel";
	const queueChannel = { id: queueChannelId } as unknown as TextChannel;

	const ownerId = "server-owner";
	const goodUserId = "good-user";

	let context: GuildedCommandContext;

	beforeEach(() => {
		context = {
			user: { id: "test-user" },
			guild: { ownerId },
			options: [
				{
					name: "user",
					value: userMention(goodUserId),
					type: ApplicationCommandOptionType.String,
				},
			],
			logger,
			reply: mockReply,
			deleteInvocation: mockDeleteMessage,
		} as unknown as GuildedCommandContext;

		mockGetQueueChannel.mockResolvedValue(queueChannel);
		mockGetUserFromMention.mockResolvedValue({ id: goodUserId } as unknown as User);

		mockRemoveUserFromStoredBlacklist.mockResolvedValue(undefined);
		mockReply.mockResolvedValue(undefined);
		mockDeleteMessage.mockResolvedValue(undefined);
	});

	test("does nothing without a valid mention (empty space)", async () => {
		context = { ...context, options: [] };
		await expect(whitelist.execute(context)).resolves.toBeUndefined();

		expect(mockReply).toHaveBeenCalledExactlyOnceWith({
			content: expect.stringContaining("mention someone") as string,
			ephemeral: true,
		});
	});

	test("does nothing without a mention (no further text)", async () => {
		context = { ...context, options: [] };
		await expect(whitelist.execute(context)).resolves.toBeUndefined();

		expect(mockReply).toHaveBeenCalledExactlyOnceWith({
			content: expect.stringContaining("mention someone") as string,
			ephemeral: true,
		});
	});

	test("does nothing for the calling user", async () => {
		mockGetUserFromMention.mockResolvedValue({ id: context.user.id } as unknown as User);
		await expect(whitelist.execute(context)).resolves.toBeUndefined();

		expect(mockRemoveUserFromStoredBlacklist).not.toHaveBeenCalled();
		expect(mockReply).toHaveBeenCalledExactlyOnceWith({
			content: expect.stringContaining("whitelist yourself") as string,
			ephemeral: true,
		});
	});

	test("does nothing for a user not known to the guild", async () => {
		mockGetUserFromMention.mockResolvedValue(null);
		await expect(whitelist.execute(context)).resolves.toBeUndefined();

		expect(mockRemoveUserFromStoredBlacklist).not.toHaveBeenCalled();
	});

	test("does nothing when there's no queue", async () => {
		mockGetQueueChannel.mockResolvedValueOnce(null);
		await expect(whitelist.execute(context)).resolves.toBeUndefined();

		expect(mockRemoveUserFromStoredBlacklist).not.toHaveBeenCalled();
	});

	test("calls whitelistUser for queue", async () => {
		await expect(whitelist.execute(context)).resolves.toBeUndefined();

		// whitelist effect
		expect(mockRemoveUserFromStoredBlacklist).toHaveBeenCalledExactlyOnceWith(
			goodUserId,
			queueChannel,
		);

		// response
		expect(mockReply).toHaveBeenCalledExactlyOnceWith({
			content: expect.stringContaining(goodUserId) as string,
			shouldMention: false,
			ephemeral: true,
		});
		expect(mockDeleteMessage).toHaveBeenCalledExactlyOnceWith();
	});
});
