import type { Command, CommandPermission, Subcommand } from "../commands/index.js";
import type { GuildMember, GuildTextBasedChannel } from "discord.js";
import { ApplicationCommandPermissionType } from "discord.js";
import { assertUnreachable } from "../helpers/assertUnreachable.js";
import { isPermissionAliasList, resolvePermissions } from "../commands/CommandPermission.js";
import { useLogger } from "../logger.js";
import {
	userHasPermissionInChannel,
	userHasRoleInGuild,
} from "../permissions/userHasOneOfRoles.js";

export type Invocable = Command | Subcommand;

const logger = useLogger();

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
	member: GuildMember,
	command: Invocable,
	channel: GuildTextBasedChannel | null,
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
	const permissions: ReadonlyArray<CommandPermission> = guild
		? isPermissionAliasList(command.permissions)
			? await resolvePermissions(command.permissions, guild)
			: await command.permissions(guild)
		: [];

	logger.debug(
		`Command '${command.name}' requires that callers satisfy 1 of ${permissions.length} cases:`,
	);

	let idx = 0;
	for (const access of permissions) {
		idx += 1;
		switch (access.type) {
			case ApplicationCommandPermissionType.Role: {
				logger.debug(
					`\tCase ${idx}: User must${access.permission ? "" : " not"} have ROLE ID: ${access.id}`,
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
					`\tCase ${idx}: User must${access.permission ? "" : " not"} have USER ID: ${access.id}`,
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
					} have 'ReadMessageHistory' access in CHANNEL ID: ${access.id}`,
				);
				const userCanSeeChannel =
					channel !== null && userHasPermissionInChannel(member, "ReadMessageHistory", access.id);
				logger.debug(
					`\tUser ${
						userCanSeeChannel ? "has" : "does not have"
					} permission to read messages in channel ${access.id}`,
				);
				if (access.permission && channel) {
					logger.debug("\tProceeding...");
					return true;
				}
				break;
			}

			default:
				return assertUnreachable(access.type);
		}
	}

	// Caller fails permissions checks
	logger.debug("User did not pass any permission checks.");
	return false;
}
