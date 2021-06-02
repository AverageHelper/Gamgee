import type Discord from "discord.js";

/**
 * Returns `true` of the given user has the named roles in the provided guild.
 *
 * @param user The user whose roles to check.
 * @param roleId The ID of the requesite Discord role.
 * @param guild The guild in which the user should have the roles.
 *
 * @returns a `Promise` that resolves with `true` of the given user has the
 * named role in the provided guild
 */
export async function userHasRoleInGuild(
	user: Discord.User,
	roleId: string,
	guild: Discord.Guild
): Promise<boolean> {
	const adminRole = await guild.roles.fetch(roleId);
	// TODO: Test that user IDs match their guild member IDs
	return adminRole?.members?.has(user.id) ?? false;
}

/**
 * Returns `true` of the given user has one of the named roles in the provided guild.
 *
 * @param user The user whose roles to check.
 * @param roleIds The IDs of the requesite Discord roles.
 * @param guild The guild in which the user should have the roles.
 *
 * @returns a `Promise` that resolves with `true` of the given user has one
 * of the named roles in the provided guild
 */
export async function userHasOneOfRoles(
	user: Discord.User,
	roleIds: ReadonlyArray<string>,
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
