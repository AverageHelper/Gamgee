import type Discord from "discord.js";
import type { Storage } from "../configStorage.js";
import type { Logger } from "../logger.js";

export interface MessageCommandInteractionOption extends Discord.CommandInteractionOption {
	value: string;
}

interface BaseCommandContext {
	/** Gamgee's Discord client. */
	client: Discord.Client;

	/** A `LocalStorage` instance scoped to the guild in which the interaction occurred. */
	storage: Storage | null;

	/** A logger to use to submit informative debug messages. */
	logger: Logger;

	/** The guild in which the command was invoked. */
	guild: Discord.Guild | null;

	/** The channel in which the command was invoked. */
	channel: Discord.TextBasedChannels | null;

	/** The user which invoked the command. */
	user: Discord.User;

	/** The UNIX time at which the command was invoked. */
	createdTimestamp: number;

	/** The options that were passed into the command. */
	options: Discord.CommandInteractionOptionResolver;

	/** Instructs Discord to keep interaction handles open long enough for long-running tasks to complete. */
	prepareForLongRunningTasks: (ephemeral?: boolean) => void | Promise<void>;

	/**
	 * Sends a DM or ephemeral reply to the command's sender.
	 *
	 * In the case of an interaction that was publicly deferred (e.g.
	 * using `prepareForLongRunningTasks(true)`), this function will
	 * edit that reply. The message will therefore be public.
	 *
	 * @param options The message payload to send.
	 * @param viaDM Whether Gamgee should reply in DMs.
	 */
	replyPrivately: (
		options: string | Discord.ReplyMessageOptions | Discord.InteractionReplyOptions,
		viaDM?: true
	) => Promise<void>;

	/** Replies to the command invocation message, optionally pinging the command's sender. */
	reply: (
		options:
			| string
			| ((Discord.ReplyMessageOptions | Discord.InteractionReplyOptions) & {
					shouldMention?: boolean;
			  })
	) => Promise<void>;

	/**
	 * Sends a message in the same channel to the user who invoked the command.
	 * Does not constitute a "reply" in Discord's canonical sense.
	 *
	 * @returns a `Promise` that resolves with a reference to the message sent,
	 * or a boolean value indicating whether an ephemeral reply succeeded or failed.
	 */
	followUp: (
		options:
			| string
			| ((Discord.ReplyMessageOptions | Discord.InteractionReplyOptions) & { reply?: boolean })
	) => Promise<Discord.Message | boolean>;

	/**
	 * Deletes the command invocation if it was sent as a text message.
	 *
	 * Note: Slash command interactions are ephemeral until replied to. This method does nothing in the case of Discord Interactions.
	 */
	deleteInvocation: () => Promise<void>;

	/** Sends a typing indicator, then stops typing after 10 seconds, or when a message is sent. */
	sendTyping: () => void;
}

interface MessageCommandContext extends BaseCommandContext {
	type: "message";

	/** The message that contains the command invocation. */
	message: Discord.Message;

	/** The options that were passed into the command. */
	options: Discord.CommandInteractionOptionResolver;
}

interface InteractionCommandContext extends BaseCommandContext {
	type: "interaction";

	/** The interaction that represents the command invocation. */
	interaction: Discord.CommandInteraction;
}

/**
 * Information relevant to a command invocation.
 */
export type CommandContext = MessageCommandContext | InteractionCommandContext;

/**
 * Information relevant to a command invocation.
 */
export type GuildedCommandContext = CommandContext & { guild: Discord.Guild };

export function isGuildedCommandContext(tbd: CommandContext): tbd is GuildedCommandContext {
	return tbd.guild !== null;
}
