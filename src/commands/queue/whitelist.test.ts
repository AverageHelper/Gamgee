jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../useQueueStorage");
jest.mock("../../helpers/getUserFromMention");

import { getUserFromMention } from "../../helpers/getUserFromMention.js";
const mockGetUserFromMention = getUserFromMention as jest.Mock;

import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { whitelistUser } from "../../useQueueStorage.js";
const mockWhitelistUser = whitelistUser as jest.Mock;

import type { GuildedCommandContext } from "../Command.js";
import { ApplicationCommandOptionType } from "discord.js";
import { useTestLogger } from "../../../tests/testUtils/logger.js";
import { whitelist } from "./whitelist.js";

const mockReply = jest.fn().mockResolvedValue(undefined);
const mockDeleteMessage = jest.fn().mockResolvedValue(undefined);

const logger = useTestLogger("error");

describe("Removing from Queue Blacklist", () => {
	const queueChannelId = "queue-channel";
	const queueChannel = { id: queueChannelId };

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
					value: `<@${goodUserId}>`,
					type: ApplicationCommandOptionType.String
				}
			],
			logger,
			reply: mockReply,
			deleteInvocation: mockDeleteMessage
		} as unknown as GuildedCommandContext;

		mockGetQueueChannel.mockResolvedValue(queueChannel);
		mockGetUserFromMention.mockResolvedValue({ id: goodUserId });

		mockWhitelistUser.mockResolvedValue(undefined);
		mockReply.mockResolvedValue(undefined);
		mockDeleteMessage.mockResolvedValue(undefined);
	});

	test("does nothing without a valid mention (empty space)", async () => {
		context = { ...context, options: [] };
		await expect(whitelist.execute(context)).resolves.toBeUndefined();

		expect(mockReply).toHaveBeenCalledOnce();
		expect(mockReply).toHaveBeenCalledWith({
			content: expect.stringContaining("mention someone") as string,
			ephemeral: true
		});
	});

	test("does nothing without a mention (no further text)", async () => {
		context = { ...context, options: [] };
		await expect(whitelist.execute(context)).resolves.toBeUndefined();

		expect(mockReply).toHaveBeenCalledOnce();
		expect(mockReply).toHaveBeenCalledWith({
			content: expect.stringContaining("mention someone") as string,
			ephemeral: true
		});
	});

	test("does nothing for the calling user", async () => {
		mockGetUserFromMention.mockResolvedValue({ id: context.user.id });
		await expect(whitelist.execute(context)).resolves.toBeUndefined();

		expect(mockWhitelistUser).not.toHaveBeenCalled();
		expect(mockReply).toHaveBeenCalledOnce();
		expect(mockReply).toHaveBeenCalledWith({
			content: expect.stringContaining("whitelist yourself") as string,
			ephemeral: true
		});
	});

	test("does nothing for a user not known to the guild", async () => {
		mockGetUserFromMention.mockResolvedValue(null);
		await expect(whitelist.execute(context)).resolves.toBeUndefined();

		expect(mockWhitelistUser).not.toHaveBeenCalled();
	});

	test("does nothing when there's no queue", async () => {
		mockGetQueueChannel.mockResolvedValueOnce(null);
		await expect(whitelist.execute(context)).resolves.toBeUndefined();

		expect(mockWhitelistUser).not.toHaveBeenCalled();
	});

	test("calls whitelistUser for queue", async () => {
		await expect(whitelist.execute(context)).resolves.toBeUndefined();

		// whitelist effect
		expect(mockWhitelistUser).toHaveBeenCalledOnce();
		expect(mockWhitelistUser).toHaveBeenCalledWith(goodUserId, queueChannel);

		// response
		expect(mockReply).toHaveBeenCalledOnce();
		expect(mockReply).toHaveBeenCalledWith({
			content: expect.stringContaining(goodUserId) as string,
			shouldMention: false,
			ephemeral: true
		});
		expect(mockDeleteMessage).toHaveBeenCalledOnce();
		expect(mockDeleteMessage).toHaveBeenCalledWith();
	});
});
