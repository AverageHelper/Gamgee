import type { Guild, User, Snowflake } from "discord.js";

/**
 * Retrieves a user with the provided `userId` from the given `guild`.
 *
 * @param guild The guild of which the user is a member.
 * @param userId The ID of the user.
 *
 * @returns a `Promise` which resolves with the user.
 */
export async function getUserWithId(guild: Guild, userId: Snowflake): Promise<User> {
	return (await guild.members.fetch(userId)).user;
}
