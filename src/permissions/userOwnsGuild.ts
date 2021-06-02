import type Discord from "discord.js";
import { ROLE_CATEGORY_OWNER } from "./RoleCategories";
import { userHasRoleCategoryInGuild } from "./userHasRoleCategoryInGuild";

/**
 * Returns `true` if the user owns the provided guild.
 *
 * @param user The user whose role to check.
 * @param guild The guild.
 *
 * @returns a `Promise` that resolves to `true` if the
 * user owns the provided guild
 */
export async function userOwnsGuild(user: Discord.User, guild: Discord.Guild): Promise<boolean> {
	return await userHasRoleCategoryInGuild(user, ROLE_CATEGORY_OWNER, guild);
}
