import type Discord from "discord.js";
import type { Storage } from "../configStorage";
import type { Logger } from "../logger";

export interface MessageCommandInteractionOption extends Discord.CommandInteractionOption {
	value: string;
}

interface ReplyOptions {
	shouldMention?: boolean;
	ephemeral?: boolean;
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
	channel:
		| Discord.TextChannel
		| Discord.DMChannel
		| Discord.NewsChannel
		| Discord.ThreadChannel
		| null;

	/** The user which invoked the command. */
	user: Discord.User;

	/** The UNIX time at which the command was invoked. */
	createdTimestamp: number;

	/** The options that were passed into the command. */
	options: Discord.Collection<string, Discord.CommandInteractionOption>;

	/** Instructs Discord to keep interaction handles open long enough for long-running tasks to complete. */
	prepareForLongRunningTasks: (ephemeral?: boolean) => void | Promise<void>;

	/**
	 * Sends a DM or ephemeral reply to the command's sender.
	 *
	 * In the case of an interaction that was publicly deferred (e.g.
	 * using `prepareForLongRunningTasks(true)`), this function will
	 * edit that reply. The message will therefore be public.
	 *
	 * @param content The message to send.
	 * @param viaDM Whether Gamgee should reply in DMs.
	 */
	replyPrivately: (content: string, viaDM?: true) => Promise<void>;

	/** Replies to the command invocation message, optionally pinging the command's sender. */
	reply: (content: string, options?: ReplyOptions) => Promise<void>;

	/** Sends a message in the same channel to the user who invoked the command. Does not constitute a "reply." */
	followUp: (
		content: string,
		options?: Discord.InteractionReplyOptions & { reply?: boolean }
	) => Promise<void>;

	/** Deletes the command invocation if it was sent as a text message. */
	deleteInvocation: () => Promise<void>;

	/** Starts the typing indicator in the channel from which the command was invoked. */
	startTyping: (count?: number) => void;

	/** Stops the typing indicator in the channel from which the command was invoked. */
	stopTyping: () => void;
}

interface MessageCommandContext extends BaseCommandContext {
	type: "message";

	/** The message that contains the command invocation. */
	message: Discord.Message;

	/** The options that were passed into the command. */
	options: Discord.Collection<string, MessageCommandInteractionOption>;
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
	return Boolean(tbd.guild);
}
