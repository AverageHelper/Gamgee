import type Discord from "discord.js";
import type { CommandContext, GuildedCommandContext } from "./CommandContext.js";
import type { CommandPermission, PermissionAlias } from "./CommandPermission.js";

export * from "./CommandContext.js";
export * from "./CommandPermission.js";

type PermissionAliasList = Array<PermissionAlias>;

type PermissionGenerator = (
	guild: Discord.Guild
) => Array<CommandPermission> | Promise<Array<CommandPermission>>;

interface BaseCommand {
	name: string;
	aliases?: Array<string>;
	description: string;
	options?: NonEmptyArray<Discord.ApplicationCommandOption | Subcommand>;
}

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

interface BaseSubcommand extends Discord.ApplicationCommandSubCommandData {
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
