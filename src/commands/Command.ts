import type Discord from "discord.js";
import type { ApplicationCommandType, ApplicationCommandOptionType } from "discord.js";
import type { CommandContext, GuildedCommandContext } from "./CommandContext.js";

export * from "./CommandContext.js";

interface BaseCommand extends Discord.ChatInputApplicationCommandData {
	aliases?: Array<string>;
	options?: NonEmptyArray<Discord.ApplicationCommandOptionData | Subcommand>;
	type?: ApplicationCommandType.ChatInput;
}

export interface GlobalCommand extends BaseCommand {
	/** Whether the command requires a guild present to execute. */
	requiresGuild: false;

	/**
	 * Whether the command can be run in DMs.
	 *
	 * By default, all global commands are accessible in DMs.
	 *
	 * @see https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-using-default-permissions
	 */
	dmPermission?: boolean;

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

	/**
	 * Default permission overwrites for user or guild command access.
	 *
	 * Unless the guild is configured otherwise, any user with one of the
	 * given permission flags will be able to actuate this command.
	 *
	 * @example
	 * ```ts
	 * {
	 * 	// any user with the `MANAGE_EVENTS` permission can use the command
	 * 	defaultMemberPermissions: ["MANAGE_EVENTS"]
	 * }
	 * ```
	 *
	 * @see https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-using-default-permissions
	 */
	defaultMemberPermissions?: ReadonlyArray<keyof Discord.PermissionFlags>;

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
	type: ApplicationCommandOptionType.Subcommand;
}

export interface GlobalSubcommand extends BaseSubcommand {
	/** Whether the subcommand requires a guild present to execute. */
	requiresGuild: false;

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

	/**
	 * The command implementation. Receives contextual information about the
	 * command invocation. May return a `Promise`.
	 *
	 * @param context Contextual information about the command invocation.
	 */
	execute: (context: GuildedCommandContext) => void | Promise<void>;
}

export type Subcommand = GlobalSubcommand | GuildedSubcommand;
