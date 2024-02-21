import type { CommandInteraction, Interaction, TextBasedChannel } from "discord.js";
import type { Command } from "../commands/index.js";
import { ChannelType } from "discord.js";
import { describe, expect, test, vi } from "vitest";

// Mock allCommands to isolate our test code
const mockAllCommands = vi.hoisted(() => new Map<string, Command>());
vi.mock("../commands/index.js", () => ({ allCommands: mockAllCommands }));

// Create two mock commands to track handler behavior
const mockGlobalExecute = vi.fn();
const mockGlobalCommand: Command = {
	name: "global-test",
	description: "lolcat",
	requiresGuild: false,
	execute: mockGlobalExecute,
};
mockAllCommands.set(mockGlobalCommand.name, mockGlobalCommand);

const mockGuildedExecute = vi.fn();
const mockGuildedCommand: Command = {
	name: "guilded-test",
	description: "lolcat",
	requiresGuild: true,
	execute: mockGuildedExecute,
};
mockAllCommands.set(mockGuildedCommand.name, mockGuildedCommand);

const mockErrorGlobalCommand: Command = {
	name: "global-error-test",
	description: "whoops",
	requiresGuild: false,
	execute: () => {
		throw new Error("Command error, this is a test");
	},
};
mockAllCommands.set(mockErrorGlobalCommand.name, mockErrorGlobalCommand);

const mockErrorGuildedCommand: Command = {
	name: "guilded-error-test",
	description: "whoops",
	requiresGuild: true,
	execute: () => {
		throw new Error("Command error, this is a test");
	},
};
mockAllCommands.set(mockErrorGuildedCommand.name, mockErrorGuildedCommand);

const userErrorMessage = "This is a user message error message";
const mockUserMessageErrorGlobalCommand: Command = {
	name: "global-error-test",
	description: "whoops",
	requiresGuild: false,
	execute: () => {
		throw new Error(userErrorMessage);
	},
};
mockAllCommands.set(mockUserMessageErrorGlobalCommand.name, mockUserMessageErrorGlobalCommand);

// Mock the logger to track output
import type { Logger } from "../logger.js";
const mockLoggerSilly = vi.fn();
const mockLoggerDebug = vi.fn();
const mockLoggerVerbose = vi.fn();
const mockLoggerError = vi.fn();
const logger: Logger = {
	silly: mockLoggerSilly,
	debug: mockLoggerDebug,
	verbose: mockLoggerVerbose,
	error: mockLoggerError,
} as unknown as Logger;

// Import the unit under test
import { interactionCreate } from "./interactionCreate.js";

// Constants for testing
const interactionError = new Error("Failed to handle interaction. This is a test.");
const selfUid = "self-1234";
const otherUid = "other-1234";
const channelId = "the-channel-1234";

const mockGuildMembersFetch = vi.fn();

// Helper function to create Interactions
// Reduces code duplication
function defaultInteraction(): Interaction {
	return {
		targetId: null,
		targetMessage: null,
		targetUser: null,
		targetMember: null,
		commandName: mockGlobalCommand.name,
		options: { data: [] },
		client: { user: { id: selfUid } },
		user: {
			bot: false,
			id: otherUid,
		},
		channelId,
		inCachedGuild: () => true,
		inGuild: () => true,
		member: { id: otherUid },
		guild: {
			id: "guild-1234",
			members: {
				fetch: mockGuildMembersFetch,
			},
		},
		channel: {
			type: ChannelType.GuildText,
			partial: false,
		},
		isButton: () => false,
		isChatInputCommand: () => true,
		isAutocomplete: () => false,
		replied: false,
	} as unknown as Interaction;
}

describe("on(interactionCreate)", () => {
	describe("commands", () => {
		test("logs interaction errors", async () => {
			const interaction = defaultInteraction();
			interaction.isChatInputCommand = (): boolean => {
				throw interactionError;
			};

			await expect(interactionCreate.execute(interaction, logger)).rejects.toBe(interactionError);
		});

		test("does nothing if the interaction isn't a supported interaction type", async () => {
			const interaction = defaultInteraction();
			interaction.isChatInputCommand = (): boolean => false;

			await expect(interactionCreate.execute(interaction, logger)).resolves.toBeUndefined();
			expect(mockGlobalExecute).not.toHaveBeenCalled();
		});

		test("does nothing if the sender is a bot", async () => {
			const interaction = defaultInteraction();
			interaction.user.bot = true;

			await expect(interactionCreate.execute(interaction, logger)).resolves.toBeUndefined();
			expect(mockGlobalExecute).not.toHaveBeenCalled();
		});

		test("does nothing if the sender is us", async () => {
			const interaction = defaultInteraction();
			interaction.user.id = selfUid;

			await expect(interactionCreate.execute(interaction, logger)).resolves.toBeUndefined();
			expect(mockGlobalExecute).not.toHaveBeenCalled();
		});

		test("does nothing if the command is not found", async () => {
			const interaction = defaultInteraction();
			(interaction as CommandInteraction).commandName = "nop";

			await expect(interactionCreate.execute(interaction, logger)).resolves.toBeUndefined();
			expect(mockGlobalExecute).not.toHaveBeenCalled();
		});

		test("calls the `execute` method of a global command from a guild", async () => {
			const interaction = defaultInteraction();

			await expect(interactionCreate.execute(interaction, logger)).resolves.toBeUndefined();
			expect(mockGlobalExecute).toHaveBeenCalledOnce();
		});

		test("calls the `execute` method of a global command from DMs", async () => {
			let interaction = defaultInteraction();
			interaction.inCachedGuild = (): boolean => false;
			interaction.inGuild = (): boolean => false;
			interaction.member = null;

			const channel = {
				type: ChannelType.DM,
			} as unknown as TextBasedChannel;

			const guild = null;

			// Overwrite 'read-only' parameters of Interaction
			interaction = {
				...interaction,
				guild: guild,
				channel: channel,
			} as unknown as Interaction;

			await expect(interactionCreate.execute(interaction, logger)).resolves.toBeUndefined();
			expect(mockGlobalExecute).toHaveBeenCalledOnce();
		});

		test("calls the `execute` method of a guilded command from a guild", async () => {
			const interaction = defaultInteraction();
			(interaction as CommandInteraction).commandName = mockGuildedCommand.name;

			await expect(interactionCreate.execute(interaction, logger)).resolves.toBeUndefined();
			expect(mockGuildedExecute).toHaveBeenCalledOnce();
		});

		test("tells the user off when they try to execute a guilded command from DMs", async () => {
			let interaction = defaultInteraction();
			(interaction as CommandInteraction).commandName = mockGuildedCommand.name;
			interaction.inCachedGuild = (): boolean => false;
			interaction.inGuild = (): boolean => false;
			interaction.member = null;

			const channel = {
				type: ChannelType.DM,
			} as unknown as TextBasedChannel;

			const guild: Interaction | null = null;

			// Overwrite 'read-only' parameters of Interaction
			interaction = {
				...interaction,
				guild: guild,
				channel: channel,
			} as unknown as Interaction;

			const mockInteractionReply = vi.fn();
			(interaction as CommandInteraction).reply = mockInteractionReply;

			await expect(interactionCreate.execute(interaction, logger)).resolves.toBeUndefined();
			expect(mockGuildedExecute).not.toHaveBeenCalled();
			expect(mockInteractionReply).toHaveBeenCalledWith({
				content: "Can't do that here.",
				ephemeral: true,
			});
		});

		test("fetches the channel when a command comes from a partial DM channel", async () => {
			let interaction = defaultInteraction();
			interaction.inCachedGuild = (): boolean => false;
			interaction.inGuild = (): boolean => false;
			interaction.member = null;

			const mockChannelFetch = vi.fn();
			const channel = {
				type: ChannelType.DM,
				partial: true,
				fetch: mockChannelFetch,
			} as unknown as TextBasedChannel;

			const guild = null;

			// Overwrite 'read-only' parameters of Interaction
			interaction = {
				...interaction,
				guild: guild,
				channel: channel,
			} as unknown as Interaction;

			await expect(interactionCreate.execute(interaction, logger)).resolves.toBeUndefined();
			expect(mockChannelFetch).toHaveBeenCalledOnce();
		});
	});
});
