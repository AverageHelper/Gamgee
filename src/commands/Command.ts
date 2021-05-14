import type Discord from "discord.js";
import type { CommandContext, GuildedCommandContext } from "./CommandContext";
import type { CommandPermission, PermissionAlias } from "./CommandPermission";

export * from "./CommandContext";
export * from "./CommandPermission";

type PermissionAliasList = NonEmptyArray<PermissionAlias>;

type PermissionGenerator = (
  guild: Discord.Guild
) => Array<CommandPermission> | Promise<Array<CommandPermission>>;

interface BaseCommand extends Discord.ApplicationCommandData {}

export interface GlobalCommand extends BaseCommand {
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
  permissions?: PermissionGenerator | PermissionAliasList;

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
export type Command = GlobalCommand | GuildedCommand;

interface BaseSubcommand extends Discord.ApplicationCommandOptionData {
  type: "SUB_COMMAND";
}

export interface GlobalSubcommand extends BaseSubcommand {
  /** Whether the subcommand requires a guild present to execute. */
  requiresGuild: false;

  /** Permission overwrites for user or guild subcommand access. */
  permissions?: undefined;

  /**
   * The command implementation. Receives contextual information about the
   * command invocation. May return a `Promise`.
   *
   * @param context Contextual information about the command invocation.
   */
  execute: (context: CommandContext) => void | Promise<void>;
}

export interface GuildedSubcommand extends BaseSubcommand {
  /** Whether the subcommand requires a guild present to execute. */
  requiresGuild: true;

  /** Permission overwrites for user or guild subcommand access. */
  permissions?: PermissionGenerator | PermissionAliasList;

  /**
   * The command implementation. Receives contextual information about the
   * command invocation. May return a `Promise`.
   *
   * @param context Contextual information about the command invocation.
   */
  execute: (context: GuildedCommandContext) => void | Promise<void>;
}

export type Subcommand = GlobalSubcommand | GuildedSubcommand;
