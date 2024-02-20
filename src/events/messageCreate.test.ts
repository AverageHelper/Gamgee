import type { Message } from "discord.js";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { MessageType } from "discord.js";
import { messageCreate } from "./messageCreate.js";
import { useTestLogger } from "../../tests/testUtils/logger.js";

// Mock the command handler
vi.mock("../handleCommand.js", () => ({ handleCommand: vi.fn() }));
import { handleCommand } from "../handleCommand.js";
const mockHandleCommand = handleCommand as Mock<
	Parameters<typeof handleCommand>,
	ReturnType<typeof handleCommand>
>;

describe("messageCreate", () => {
	const logger = useTestLogger();
	let message: Message;
	const mockMessageFetch = vi.fn();

	beforeEach(() => {
		message = {
			partial: false,
			client: {
				user: {
					id: "me",
				},
			},
			author: {
				id: "not-me",
			},
			type: MessageType.Default,
			fetch: mockMessageFetch,
		} as unknown as Message;
		mockMessageFetch.mockResolvedValue(message);
	});

	test("calls the interaction handler", async () => {
		await expect(messageCreate.execute(message, logger)).resolves.toBeUndefined();
		expect(mockMessageFetch).not.toHaveBeenCalled();
		expect(mockHandleCommand).toHaveBeenCalledOnce();
	});

	test("fetches partial messages", async () => {
		message = { ...message, partial: true } as unknown as Message;
		mockMessageFetch.mockResolvedValue(message);

		await expect(messageCreate.execute(message, logger)).resolves.toBeUndefined();
		expect(mockMessageFetch).toHaveBeenCalledOnce();
		expect(mockHandleCommand).toHaveBeenCalledOnce();
	});

	test("ignores messages sent by the client", async () => {
		message.author.id = message.client.user.id;

		await expect(messageCreate.execute(message, logger)).resolves.toBeUndefined();
		expect(mockMessageFetch).not.toHaveBeenCalled();
		expect(mockHandleCommand).not.toHaveBeenCalled();
	});

	// Ignore messages that aren't of type `Default` or `Reply`
	const allTypes = [
		// TODO: Generate this list dynamically
		["Default", MessageType.Default],
		["RecipientAdd", MessageType.RecipientAdd],
		["RecipientRemove", MessageType.RecipientRemove],
		["Call", MessageType.Call],
		["ChannelNameChange", MessageType.ChannelNameChange],
		["ChannelIconChange", MessageType.ChannelIconChange],
		["ChannelPinnedMessage", MessageType.ChannelPinnedMessage],
		["UserJoin", MessageType.UserJoin],
		["GuildBoost", MessageType.GuildBoost],
		["GuildBoostTier1", MessageType.GuildBoostTier1],
		["GuildBoostTier2", MessageType.GuildBoostTier2],
		["GuildBoostTier3", MessageType.GuildBoostTier3],
		["ChannelFollowAdd", MessageType.ChannelFollowAdd],
		["GuildDiscoveryDisqualified", MessageType.GuildDiscoveryDisqualified],
		["GuildDiscoveryRequalified", MessageType.GuildDiscoveryRequalified],
		[
			"GuildDiscoveryGracePeriodInitialWarning",
			MessageType.GuildDiscoveryGracePeriodInitialWarning,
		],
		["GuildDiscoveryGracePeriodFinalWarning", MessageType.GuildDiscoveryGracePeriodFinalWarning],
		["ThreadCreated", MessageType.ThreadCreated],
		["Reply", MessageType.Reply],
		["ChatInputCommand", MessageType.ChatInputCommand],
		["ThreadStarterMessage", MessageType.ThreadStarterMessage],
		["GuildInviteReminder", MessageType.GuildInviteReminder],
		["ContextMenuCommand", MessageType.ContextMenuCommand],
	] as const;

	for (const [typeName, type] of allTypes) {
		if (type === MessageType.Default || type === MessageType.Reply) {
			test(`handles '${typeName}' messages`, async () => {
				message.type = type;

				await expect(messageCreate.execute(message, logger)).resolves.toBeUndefined();
				expect(mockMessageFetch).not.toHaveBeenCalled();
				expect(mockHandleCommand).toHaveBeenCalledOnce();
			});
		} else {
			test(`ignores '${typeName}' messages`, async () => {
				message.type = type;

				await expect(messageCreate.execute(message, logger)).resolves.toBeUndefined();
				expect(mockMessageFetch).not.toHaveBeenCalled();
				expect(mockHandleCommand).not.toHaveBeenCalled();
			});
		}
	}
});
