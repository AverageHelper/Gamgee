import type Discord from "discord.js";
import type { Snowflake } from "discord.js";

/**
 * Returns `true` if the given user has the named roles in the provided guild.
 *
 * @param user The user whose roles to check.
 * @param roleId The ID of the requesite Discord role.
 * @param guild The guild in which the user should have the roles.
 *
 * @returns a `Promise` that resolves with `true` if the given user has the
 * named role in the provided guild.
 */
export async function userHasRoleInGuild(
	user: Discord.GuildMember,
	roleId: Snowflake,
	guild: Discord.Guild
): Promise<boolean> {
	const adminRole = await guild.roles.fetch(roleId);
	// TODO: Test that user IDs match their guild member IDs
	return adminRole?.members?.has(user.id) ?? false;
}

/**
 * Returns `true` if the given user has the named permission in the provided channel.
 *
 * @param user The user whose permission to check.
 * @param permission
 * @param channel The channel in which the user should have permissions.
 *
 * @returns `true` if the given user has the
 * named role in the provided channel.
 */
export function userHasPermissionInChannel(
	user: Discord.GuildMember,
	permission: Discord.PermissionResolvable,
	channel: Discord.GuildChannelResolvable
): boolean {
	return user //
		.permissionsIn(channel)
		.has(permission);
}

/**
 * Returns `true` if the given user has one of the named roles in the provided guild.
 *
 * @param user The user whose roles to check.
 * @param roleIds The IDs of the requesite Discord roles.
 * @param guild The guild in which the user should have the roles.
 *
 * @returns a `Promise` that resolves with `true` if the given user has one
 * of the named roles in the provided guild.
 */
export async function userHasOneOfRoles(
	user: Discord.User,
	roleIds: ReadonlyArray<Snowflake>,
	guild: Discord.Guild
): Promise<boolean> {
	const adminRoles = await Promise.all(
		roleIds.map(roleId => guild.roles.fetch(roleId)) //
	);

	// TODO: Test that user IDs match their guild member IDs
	return adminRoles.some(
		role => role?.members?.has(user.id) ?? false //
	);
}
