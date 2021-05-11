import type Discord from "discord.js";
import type { Storage } from "../configStorage";
import type { Logger } from "../logger";
import { userHasRoleInGuild } from "../permissions";

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

export interface CommandPermission extends Discord.ApplicationCommandPermissionData {
  /** The `id` of the role or user */
  id: Discord.Snowflake;

  type: "ROLE" | "USER";

  /** `true` to allow, `false` to disallow */
  permission: boolean;
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

type BaseCommand = Discord.ApplicationCommandData;

export interface NormalCommand extends BaseCommand {
  /** Whether the command requires a guild present to execute. */
  requiresGuild: false;

  /** Permission overwrites for user or guild command access. */
  permissions?: undefined;

  /**
   * The command implementation. Receives contextual information about the
   * command invocation. May return a `Promise`.
   *
   * @param context Contextual information about the command invocation.
   */
  execute: (context: CommandContext) => void | Promise<void>;
}

export interface GuildedCommand extends BaseCommand {
  /** Whether the command requires a guild present to execute. */
  requiresGuild: true;

  /** Permission overwrites for user or guild command access. */
  permissions?: (
    guild: Discord.Guild
  ) => NonEmptyArray<CommandPermission> | Promise<NonEmptyArray<CommandPermission>>;

  /**
   * The command implementation. Receives contextual information about the
   * command invocation. May return a `Promise`.
   *
   * @param context Contextual information about the command invocation.
   */
  execute: (context: GuildedCommandContext) => void | Promise<void>;
}

/**
 * A top-level command description.
 */
export type Command = NormalCommand | GuildedCommand;

export interface Subcommand extends Discord.ApplicationCommandOptionData {
  type: "SUB_COMMAND" | "SUB_COMMAND_GROUP";

  /**
   * The command implementation. Receives contextual information about the
   * command invocation. May return a `Promise`.
   *
   * @param context Contextual information about the command invocation.
   */
  execute: (context: CommandContext) => void | Promise<void>;
}

async function failPermissions(context: CommandContext): Promise<void> {
  return context.replyPrivately("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
}

async function failNoGuild(context: CommandContext): Promise<void> {
  return context.reply("Can't do that here.", { ephemeral: true });
}

function neverFallthrough(val: never): never {
  throw new TypeError(`Unexpected case: ${JSON.stringify(val)}`);
}

/**
 * Runs the command if the invocation context satisfies the command's declared invariants.
 *
 * @param command The command to execute.
 * @param context The invocation context.
 */
export async function invokeCommand(command: Command, context: CommandContext): Promise<void> {
  if (!command.requiresGuild)
    // No guild required
    return command.execute(context);

  if (!isGuildedCommandContext(context))
    // No guild found
    return failNoGuild(context);

  if (!command.permissions)
    // No permissions demanded
    return command.execute(context);

  const permissions = await command.permissions(context.guild);
  for (const permission of permissions) {
    switch (permission.type) {
      case "ROLE": {
        const userHasRole = await userHasRoleInGuild(context.user, permission.id, context.guild);
        if (permission.permission) {
          // User should have a role
          if (!userHasRole) {
            return failPermissions(context);
          }
        } else {
          // User shouldn't have a role
          if (userHasRole) {
            return failPermissions(context);
          }
        }
        break;
      }

      case "USER": {
        // User should (or shouldn't) have an identity
        const userHasId = context.user.id === permission.id;
        if (permission.permission) {
          // User should have an identity
          if (!userHasId) {
            return failPermissions(context);
          }
        } else {
          // User shouldn't have an identity
          if (userHasId) {
            return failPermissions(context);
          }
        }
        break;
      }

      default:
        return neverFallthrough(permission.type);
    }
  }

  // Caller passes permissions checks
  return command.execute(context);
}
