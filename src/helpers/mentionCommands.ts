import type { ApplicationCommand, Guild } from "discord.js";
import type { Code } from "./composeStrings.js";
import type { GlobalCommand, GuildedCommand, Subcommand } from "../commands/index.js";
import { code } from "./composeStrings.js";
import { useLogger } from "../logger.js";

const logger = useLogger();

const deployedGuildCommands = new Map<string, ReadonlyMap<string, ApplicationCommand>>();
const deployedGlobalCommands = new Map<string, ApplicationCommand>();

/**
 * Associates the given Discord command deployment with the given command definition.
 *
 * @param command The known command definition.
 * @param deployment The deployed command.
 */
export function rememberDeploymentForGlobalCommand(
	command: GlobalCommand,
	deployment: ApplicationCommand,
): void {
	logger.debug(`Global command /${command.name}, id: '${deployment.id}'`);
	deployedGlobalCommands.set(command.name, deployment);
}

/**
 * Associates the given Discord command with the given command definition and the given guild.
 *
 * @param command The known command definition.
 * @param guildId The ID of the guild in which the deployed command exists.
 * @param deployment The deployed command.
 */
export function rememberDeploymentForCommandInGuild(
	command: GuildedCommand,
	guildId: string,
	deployment: ApplicationCommand,
): void {
	logger.debug(`Guild '${guildId}' command /${command.name}, id: '${deployment.id}'`);
	const commandsInGuild = new Map(deployedGuildCommands.get(guildId));
	commandsInGuild.set(command.name, deployment);
	deployedGuildCommands.set(guildId, commandsInGuild);
}

// See https://discord.com/developers/docs/change-log#slash-command-mentions

type CommandMention = `</${string}:${string}>`;
type SubcommandMention = `</${string} ${string}:${string}>`;

function mentionAppCommand(command: ApplicationCommand): CommandMention {
	return `</${command.name}:${command.id}>`;
}

function mentionAppSubcommand(command: ApplicationCommand, subcommand: string): SubcommandMention {
	return `</${command.name} ${subcommand}:${command.id}>`;
}

/**
 * Creates a mention string for the given command. If Discord doesn't know
 * the given command, then the message-command version is named instead,
 * using the given `fallbackPrefix`.
 *
 * @param command The command definition to mention.
 * @param fallbackPrefix The string to use as the command prefix if we must
 * fall back to message command format.
 */
export function mentionCommand<P extends string>(
	command: GlobalCommand,
	fallbackPrefix: P,
): CommandMention | Code<`${P}${string}`>;

/**
 * Creates a mention string for the given command. If Discord doesn't know
 * the given command, then the message-command version is named instead,
 * using the given `fallbackPrefix`.
 *
 * @param command The command definition to mention.
 * @param guild The guild in which to look for the deployed command.
 * @param fallbackPrefix The string to use as the command prefix if we must
 * fall back to message command format.
 */
export function mentionCommand<P extends string>(
	command: GuildedCommand,
	guild: Guild | null,
	fallbackPrefix: P,
): CommandMention | Code<`${P}${string}`>;

export function mentionCommand<P extends string>(
	...args: Readonly<
		| [command: GlobalCommand, fallbackPrefix: P]
		| [command: GuildedCommand, guild: Guild | null, fallbackPrefix: P]
	>
): CommandMention | Code<`${P}${string}`> {
	if (args.length === 2) {
		// Guilded Commands
		const [command, fallbackPrefix] = args;
		const cached = deployedGlobalCommands.get(command.name);
		if (!cached) {
			// Default to message-command mention
			return code(`${fallbackPrefix}${command.name}`);
		}
		return mentionAppCommand(cached);
	}

	// Global Commands
	const [command, guild, fallbackPrefix] = args;
	const guildCommands = guild ? deployedGuildCommands.get(guild.id) : undefined;
	const cached = guildCommands?.get(command.name);
	if (!cached) {
		// Default to message-command mention
		return code(`${fallbackPrefix}${command.name}`);
	}
	return mentionAppCommand(cached);
}

/**
 * Creates a mention string for the given subcommand. If Discord doesn't know
 * the given command, then the message-command version is named instead, using
 * the given `fallbackPrefix`.
 *
 * @param command The parent to the subcommand.
 * @param subcommand The subcommand definition to mention.
 * @param guild The guild in which to look for the deployed command.
 * @param fallbackPrefix The string to use as the command prefix if we must
 * fall back to message command format.
 */
export function mentionSubcommand<P extends string>(
	command: GuildedCommand,
	subcommand: Subcommand,
	guild: Guild | null,
	fallbackPrefix: P,
): SubcommandMention | Code<`${P}${string}`> {
	const guildCommands = guild ? deployedGuildCommands.get(guild.id) : undefined;
	const cached = guildCommands?.get(command.name);
	if (!cached) {
		// Default to message-command mention
		return code(`${fallbackPrefix}${command.name} ${subcommand.name}`);
	}
	return mentionAppSubcommand(cached, subcommand.name);
}
