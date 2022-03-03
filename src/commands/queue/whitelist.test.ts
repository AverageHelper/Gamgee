jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../useQueueStorage");
jest.mock("../../helpers/getUserFromMention");

import getUserFromMention from "../../helpers/getUserFromMention.js";
const mockGetUserFromMention = getUserFromMention as jest.Mock;

import getQueueChannel from "../../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { useQueueStorage } from "../../useQueueStorage.js";
const mockUseQueueStorage = useQueueStorage as jest.Mock;

import type { QueueEntryManager } from "../../useQueueStorage.js";
import type { GuildedCommandContext } from "../Command.js";
import { useTestLogger } from "../../../tests/testUtils/logger.js";
import Discord from "discord.js";
import whitelist from "./whitelist.js";

const mockClient = ({} as unknown) as Discord.Client;
const mockWhitelistUser = jest.fn();
const mockReply = jest.fn().mockResolvedValue(undefined);
const mockDeleteMessage = jest.fn().mockResolvedValue(undefined);

const logger = useTestLogger("error");

describe("Removing from Queue Blacklist", () => {
	const queueChannelId = "queue-channel";

	const ownerId = "server-owner";
	const goodUserId = "good-user";

	let context: GuildedCommandContext;
	let queue: QueueEntryManager;

	beforeEach(() => {
		context = ({
			user: { id: "test-user" },
			guild: { ownerId },
			options: new Discord.CommandInteractionOptionResolver(mockClient, [
				{
					name: "user",
					value: `<@${goodUserId}>`,
					type: "STRING"
				}
			]),
			logger,
			reply: mockReply,
			deleteInvocation: mockDeleteMessage
		} as unknown) as GuildedCommandContext;

		queue = ({
			whitelistUser: mockWhitelistUser
		} as unknown) as QueueEntryManager;

		mockGetQueueChannel.mockResolvedValue({ id: queueChannelId });
		mockGetUserFromMention.mockResolvedValue({ id: goodUserId });

		mockUseQueueStorage.mockReturnValue(queue);
		mockWhitelistUser.mockResolvedValue(undefined);
		mockReply.mockResolvedValue(undefined);
		mockDeleteMessage.mockResolvedValue(undefined);
	});

	test("does nothing without a valid mention (empty space)", async () => {
		context.options = new Discord.CommandInteractionOptionResolver(mockClient, []);
		await expect(whitelist.execute(context)).resolves.toBeUndefined();

		expect(mockReply).toHaveBeenCalledTimes(1);
		expect(mockReply).toHaveBeenCalledWith({
			content: expect.stringContaining("mention someone") as string,
			ephemeral: true
		});
	});

	test("does nothing without a mention (no further text)", async () => {
		context.options = new Discord.CommandInteractionOptionResolver(mockClient, []);
		await expect(whitelist.execute(context)).resolves.toBeUndefined();

		expect(mockReply).toHaveBeenCalledTimes(1);
		expect(mockReply).toHaveBeenCalledWith({
			content: expect.stringContaining("mention someone") as string,
			ephemeral: true
		});
	});

	test("does nothing for the calling user", async () => {
		mockGetUserFromMention.mockResolvedValue({ id: context.user.id });
		await expect(whitelist.execute(context)).resolves.toBeUndefined();

		expect(mockWhitelistUser).not.toHaveBeenCalled();
		expect(mockReply).toHaveBeenCalledTimes(1);
		expect(mockReply).toHaveBeenCalledWith({
			content: expect.stringContaining("whitelist yourself") as string,
			ephemeral: true
		});
	});

	test("does nothing for a user not known to the guild", async () => {
		mockGetUserFromMention.mockResolvedValue(undefined);
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
		expect(mockWhitelistUser).toHaveBeenCalledTimes(1);
		expect(mockWhitelistUser).toHaveBeenCalledWith(goodUserId);

		// response
		expect(mockReply).toHaveBeenCalledTimes(1);
		expect(mockReply).toHaveBeenCalledWith({
			content: expect.stringContaining(goodUserId) as string,
			shouldMention: false,
			ephemeral: true
		});
		expect(mockDeleteMessage).toHaveBeenCalledTimes(1);
		expect(mockDeleteMessage).toHaveBeenCalledWith();
	});
});
