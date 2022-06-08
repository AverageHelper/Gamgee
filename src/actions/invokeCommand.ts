import type Discord from "discord.js";
import type { Command, CommandContext, GuildedCommand, Subcommand } from "../commands/index.js";
import { Collection, Permissions } from "discord.js";
import { isGuildedCommandContext } from "../commands/index.js";
import { useLogger } from "../logger.js";
import { userHasPermissionInChannel, userHasRoleInGuild } from "../userHasOneOfRoles.js";
import { richErrorMessage } from "../helpers/richErrorMessage.js";

const logger = useLogger();

type Invocable = Command | Subcommand;

async function failPermissions(context: CommandContext): Promise<void> {
	return context.replyPrivately("You don't have permission to run that command.");
}

async function failNoGuild(context: CommandContext): Promise<void> {
	return context.reply({ content: "Can't do that here.", ephemeral: true });
}

function neverFallthrough(val: never): never {
	throw new TypeError(`Unexpected case: ${JSON.stringify(val)}`);
}

/**
 * Assesses whether the calling guild member is allowed to run the given command.
 *
 * @param member The calling guild member.
 * @param command The command the user wants to run.
 * @param channel The channel in which the command is being run.
 *
 * @returns `true` if the user may be permitted to run the command. `false` otherwise.
 */
export async function assertUserCanRunCommand(
	member: Discord.GuildMember,
	command: GuildedCommand,
	channel: Discord.GuildTextBasedChannel
): Promise<boolean> {
	// Gather permission details
	const guild = channel.guild;
	const guildId = guild.id;
	const client = guild.client;

	// TODO: Cache this for each command on startup
	const guildCommands = await guild.commands
		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
		.fetch({ command: client.user?.id } as Discord.FetchGuildApplicationCommandFetchOptions) // FIXME: wating on v14 for this call to work
		.catch((error: unknown) => {
			logger.error(richErrorMessage(`Failed to fetch commands for guild ${guildId}`, error));
			return new Collection<string, Discord.ApplicationCommand>();
		});
	const guildCommand = guildCommands.find(cmd => cmd.name === command.name) ?? null;

	const defaultPermissions =
		command.defaultMemberPermissions !== undefined
			? new Permissions(command.defaultMemberPermissions)
			: null;
	// TODO: Cache this for each command on startup
	const permissions = await guildCommand?.permissions //
		.fetch({})
		.catch((error: unknown) => {
			logger.error(
				richErrorMessage(
					`Failed to fetch permissions for command '${guildCommand.name}' in guild ${guildId}`,
					error
				)
			);
			return undefined;
		});

	if (!permissions && !defaultPermissions) {
		// No permissions configured, assume the user is fine
		logger.debug(`Command '${command.name}' has no permission requirements to satisfy.`);
		logger.debug("\tProceeding...");
		return true;
	}

	if (permissions?.length === 0 || defaultPermissions?.toArray().length === 0) {
		// Empty permissions configured, assume no access
		logger.debug(`Command '${command.name}' is configured to block any access.`);
		return false;
	}

	logger.debug(
		`Command '${command.name}' requires that callers satisfy 1 of ${
			permissions?.length ?? "null"
		} cases:`
	);

	// Check configured permissions
	let idx = 0;
	for (const access of permissions ?? []) {
		idx += 1;
		logger.debug(
			`\tCase ${idx}: User must${access.permission ? "" : " not"} have ${access.type} ID: ${
				access.id
			}`
		);
		switch (access.type) {
			case "ROLE": {
				const userHasRole = await userHasRoleInGuild(member, access.id, guild);
				logger.debug(`\tUser ${userHasRole ? "has" : "does not have"} role ${access.id}`);
				if (access.permission && userHasRole) {
					logger.debug("\tProceeding...");
					return true;
				}
				break;
			}

			case "USER": {
				const userHasId = member.user.id === access.id;
				logger.debug(`\tUser ${userHasId ? "has" : "does not have"} ID ${access.id}`);
				if (access.permission && userHasId) {
					logger.debug("\tProceeding...");
					return true;
				}
				break;
			}

			default:
				return neverFallthrough(access.type);
		}
	}

	// Check default permissions
	if (defaultPermissions && userHasPermissionInChannel(member, defaultPermissions, channel)) {
		return true;
	}

	// Caller fails permissions checks
	logger.debug("User did not pass any permission checks.");
	return false;
}

/**
 * Runs the command if the invocation context satisfies the command's
 * declared guild and permission requirements.
 *
 * @param command The command to execute.
 * @param context The invocation context.
 */
export async function invokeCommand(command: Invocable, context: CommandContext): Promise<void> {
	if (!command.requiresGuild) {
		// No guild required
		logger.debug(`Command '${command.name}' does not require guild information.`);
		logger.debug("Proceeding...");
		return command.execute(context);
	}

	if (!isGuildedCommandContext(context)) {
		// No guild found
		logger.debug(`Command '${command.name}' requires guild information, but none was found.`);
		return failNoGuild(context);
	}

	if (
		context.channel &&
		command.type !== "SUB_COMMAND" &&
		(await assertUserCanRunCommand(context.member, command, context.channel))
	) {
		return command.execute(context);
	}
	return failPermissions(context);
}
