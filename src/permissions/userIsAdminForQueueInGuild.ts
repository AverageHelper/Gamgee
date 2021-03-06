import type Discord from "discord.js";
import { userHasRoleCategoryInGuild } from "./userHasRoleCategoryInGuild";
import { ROLE_CATEGORY_QUEUE_ADMIN } from "./RoleCategories";

export async function userIsAdminForQueueInGuild(
	user: Discord.User,
	guild: Discord.Guild
): Promise<boolean> {
	return userHasRoleCategoryInGuild(user, ROLE_CATEGORY_QUEUE_ADMIN, guild);
}
