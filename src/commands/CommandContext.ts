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
  channel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel | null;

  /** The user which invoked the command. */
  user: Discord.User;

  /** The UNIX time at which the command was invoked. */
  createdTimestamp: number;

  /** The options that were passed into the command. */
  options: Array<Discord.CommandInteractionOption>;

  /** Instructs Discord to keep interaction handles open long enough for long-running tasks to complete. */
  prepareForLongRunningTasks: (ephemeral?: boolean) => Promise<void>;

  /** Sends a DM to the command's sender. */
  replyPrivately: (content: string) => Promise<void>;

  /** Replies to the command invocation message, optionally pinging the command's sender. */
  reply: (content: string, options?: ReplyOptions) => Promise<void>;

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
  options: Array<MessageCommandInteractionOption>;
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
