import type Discord from "discord.js";
import type { Command, CommandContext, CommandPermission, Subcommand } from "../commands/index.js";
import { ApplicationCommandPermissionType } from "discord.js";
import { isGuildedCommandContext, resolvePermissions } from "../commands/index.js";
import { useLogger } from "../logger.js";
import {
	userHasPermissionInChannel,
	userHasRoleInGuild
} from "../permissions/userHasOneOfRoles.js";

const logger = useLogger();

type Invocable = Command | Subcommand;

async function failPermissions(context: CommandContext): Promise<void> {
	return await context.replyPrivately({
		content: "You don't have permission to run that command.",
		ephemeral: true
	});
}

async function failNoGuild(context: CommandContext): Promise<void> {
	return await context.reply({ content: "Can't do that here.", ephemeral: true });
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
	command: Invocable,
	channel: Discord.GuildTextBasedChannel | null
): Promise<boolean> {
	if (command.requiresGuild && !channel) {
		logger.debug(`Command '${command.name}' reqires a guild, but we don't have one right now.`);
		return false;
	}

	if (!command.permissions) {
		// No permissions demanded
		logger.debug(`Command '${command.name}' does not require specific user permissions.`);
		logger.debug("Proceeding...");
		return true;
	}

	const guild = channel?.guild;
	const permissions: Array<CommandPermission> = guild
		? Array.isArray(command.permissions)
			? await resolvePermissions(command.permissions, guild)
			: await command.permissions(guild)
		: [];

	logger.debug(
		`Command '${command.name}' requires that callers satisfy 1 of ${permissions.length} cases:`
	);

	let idx = 0;
	for (const access of permissions) {
		idx += 1;
		switch (access.type) {
			case ApplicationCommandPermissionType.Role: {
				logger.debug(
					`\tCase ${idx}: User must${access.permission ? "" : " not"} have ROLE ID: ${access.id}`
				);
				const userHasRole =
					guild !== undefined && (await userHasRoleInGuild(member, access.id, guild));
				logger.debug(`\tUser ${userHasRole ? "has" : "does not have"} role ${access.id}`);
				if (access.permission && userHasRole) {
					logger.debug("\tProceeding...");
					return true;
				}
				break;
			}

			case ApplicationCommandPermissionType.User: {
				logger.debug(
					`\tCase ${idx}: User must${access.permission ? "" : " not"} have USER ID: ${access.id}`
				);
				const userHasId = member.id === access.id;
				logger.debug(`\tUser ${userHasId ? "has" : "does not have"} ID ${access.id}`);
				if (access.permission && userHasId) {
					logger.debug("\tProceeding...");
					return true;
				}
				break;
			}

			case ApplicationCommandPermissionType.Channel: {
				logger.debug(
					`\tCase ${idx}: User must${
						access.permission ? "" : " not"
					} have 'ReadMessageHistory' access in CHANNEL ID: ${access.id}`
				);
				const userCanSeeChannel =
					channel !== null && userHasPermissionInChannel(member, "ReadMessageHistory", access.id);
				logger.debug(
					`\tUser ${
						userCanSeeChannel ? "has" : "does not have"
					} permission to read messages in channel ${access.id}`
				);
				if (access.permission && channel) {
					logger.debug("\tProceeding...");
					return true;
				}
				break;
			}

			default:
				return neverFallthrough(access.type);
		}
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
		return await command.execute(context);
	}

	if (!isGuildedCommandContext(context)) {
		// No guild found
		logger.debug(`Command '${command.name}' requires guild information, but none was found.`);
		return await failNoGuild(context);
	}

	if (await assertUserCanRunCommand(context.member, command, context.channel)) {
		return await command.execute(context);
	}
	return await failPermissions(context);
}
