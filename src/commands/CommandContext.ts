import type Discord from "discord.js";
import type { Storage } from "../configStorage.js";
import type { Logger } from "../logger.js";

export type MessageCommandInteractionOption = Discord.CommandInteractionOption;

interface BaseCommandContext {
	/** Gamgee's Discord client. */
	readonly client: Discord.Client<true>;

	/** A `LocalStorage` instance scoped to the guild in which the interaction occurred. */
	readonly storage: Storage | null;

	/** A logger to use to submit informative debug messages. */
	readonly logger: Logger;

	/** The guild in which the command was invoked. */
	readonly guild: Discord.Guild | null;

	/** The channel in which the command was invoked. */
	readonly channel: Discord.GuildTextBasedChannel | Discord.DMChannel | null;

	/** The user which invoked the command. */
	readonly user: Discord.User;

	/** The guild member which invoked the command. */
	readonly member: Discord.GuildMember | null;

	/** The UNIX time at which the command was invoked. */
	readonly createdTimestamp: number;

	/** The options that were passed into the command. */
	readonly options: ReadonlyArray<MessageCommandInteractionOption>;

	/** Instructs Discord to keep interaction handles open long enough for long-running tasks to complete. */
	prepareForLongRunningTasks: (ephemeral?: boolean) => void | Promise<void>;

	/**
	 * Deletes the command invocation if it was sent as a text message.
	 *
	 * Note: Slash command interactions are ephemeral until replied to. This method does nothing in the case of Discord Interactions.
	 */
	deleteInvocation: () => Promise<void>;

	/** Sends a typing indicator, then stops typing after 10 seconds, or when a message is sent. */
	sendTyping: () => void;

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
		options:
			| string
			| Omit<Discord.ReplyMessageOptions, "flags">
			| Omit<Discord.InteractionReplyOptions, "flags">,
		viaDM?: true
	) => Promise<void>;

	/** Replies to the command invocation message, optionally pinging the command's sender. */
	reply: (
		options:
			| string
			| Omit<Discord.ReplyMessageOptions, "flags">
			| (Omit<Discord.InteractionReplyOptions, "flags"> & {
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
			| Omit<Discord.ReplyMessageOptions, "flags">
			| (Omit<Discord.InteractionReplyOptions, "flags"> & {
					reply?: boolean;
			  })
	) => Promise<Discord.Message | boolean>;
}

interface MessageCommandContext extends BaseCommandContext {
	readonly type: "message";

	/** The message that contains the command invocation. */
	readonly message: Discord.Message;

	/** The options that were passed into the command. */
	readonly options: ReadonlyArray<MessageCommandInteractionOption>;
}

interface InteractionCommandContext extends BaseCommandContext {
	readonly type: "interaction";

	/** The interaction that represents the command invocation. */
	readonly interaction: Discord.CommandInteraction;
}

/**
 * Information relevant to a command invocation.
 */
export type CommandContext = MessageCommandContext | InteractionCommandContext;

/**
 * Information relevant to a command invocation.
 */
export type GuildedCommandContext = CommandContext & {
	readonly guild: Discord.Guild;
	readonly member: Discord.GuildMember;
	readonly channel: Discord.GuildTextBasedChannel | null;
};

export function isGuildedCommandContext(tbd: CommandContext): tbd is GuildedCommandContext {
	return tbd.guild !== null && tbd.member !== null && tbd.channel?.type !== "DM";
}
