import type {
	ApplicationCommandOptionData,
	ApplicationCommandOptionType,
	ApplicationCommandSubCommandData,
	ApplicationCommandType,
	ChatInputApplicationCommandData,
	Guild,
} from "discord.js";
import type { CommandContext, GuildedCommandContext } from "./CommandContext.js";
import type { CommandPermission, PermissionAlias } from "./CommandPermission.js";

export * from "./CommandContext.js";
export * from "./CommandPermission.js";

export type PermissionAliasList = ReadonlyArray<PermissionAlias>;

export type PermissionGenerator = (
	guild: Guild,
) => Array<CommandPermission> | Promise<Array<CommandPermission>>;

interface BaseCommand extends Omit<
	ChatInputApplicationCommandData,
	"options" | "type" | "permissions" | "defaultMemberPermissions" | "dmPermission"
> {
	readonly aliases?: ReadonlyArray<string>;
	readonly options?: Readonly<NonEmptyArray<ApplicationCommandOptionData>>;
	readonly type?: ApplicationCommandType.ChatInput;

	/**
	 * Deprecated commands are hidden from normal `/help` output,
	 * marked in user-facing contexts with a *"Deprecated"* note,
	 * and should be removed in the next Semver major version.
	 *
	 * Users may still invoke a deprecated command. Use such
	 * invocations this as opportunities to educate users about
	 * the command's alternatives, if any.
	 */
	readonly deprecated?: boolean;
}

export interface GlobalCommand extends BaseCommand {
	/** Whether the command requires a guild present to execute. */
	readonly requiresGuild: false;

	/** Permission overwrites for user or guild command access. */
	readonly permissions?: undefined;
	readonly defaultMemberPermissions?: undefined;
	readonly dmPermission?: undefined;

	/**
	 * The command implementation. Receives contextual information about the
	 * command invocation. May return a `Promise`.
	 *
	 * @param context Contextual information about the command invocation.
	 */
	readonly execute: (context: CommandContext) => void | Promise<void>;
}

export interface GuildedCommand extends BaseCommand {
	/** Whether the command requires a guild present to execute. */
	readonly requiresGuild: true;

	/** Permission overwrites for user or guild command access. */
	readonly permissions?: PermissionGenerator | PermissionAliasList;

	// TODO: Unblock these and use them instead of the above `permissions` value
	readonly defaultMemberPermissions?: undefined;
	readonly dmPermission?: undefined;

	/**
	 * The command implementation. Receives contextual information about the
	 * command invocation. May return a `Promise`.
	 *
	 * @param context Contextual information about the command invocation.
	 */
	readonly execute: (context: GuildedCommandContext) => void | Promise<void>;
}

/**
 * A top-level command description.
 */
export type Command = GlobalCommand | GuildedCommand;

interface BaseSubcommand extends Omit<
	ApplicationCommandSubCommandData,
	"type" | "permissions" | "defaultMemberPermissions" | "dmPermission"
> {
	readonly type: ApplicationCommandOptionType.Subcommand;
}

export interface GlobalSubcommand extends BaseSubcommand {
	/** Whether the subcommand requires a guild present to execute. */
	readonly requiresGuild: false;

	/** Permission overwrites for user or guild subcommand access. */
	readonly permissions?: undefined;
	readonly defaultMemberPermissions?: undefined;
	readonly dmPermission?: undefined;

	/**
	 * The command implementation. Receives contextual information about the
	 * command invocation. May return a `Promise`.
	 *
	 * @param context Contextual information about the command invocation.
	 */
	readonly execute: (context: CommandContext) => void | Promise<void>;
}

export interface GuildedSubcommand extends BaseSubcommand {
	/** Whether the subcommand requires a guild present to execute. */
	readonly requiresGuild: true;

	/** Permission overwrites for user or guild subcommand access. */
	readonly permissions?: PermissionGenerator | PermissionAliasList;

	// TODO: Unblock these and use them instead of the above `permissions` value
	readonly defaultMemberPermissions?: undefined;
	readonly dmPermission?: undefined;

	/**
	 * The command implementation. Receives contextual information about the
	 * command invocation. May return a `Promise`.
	 *
	 * @param context Contextual information about the command invocation.
	 */
	readonly execute: (context: GuildedCommandContext) => void | Promise<void>;
}

export type Subcommand = GlobalSubcommand | GuildedSubcommand;
