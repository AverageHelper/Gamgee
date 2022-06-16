import type Discord from "discord.js";
import { userHasRoleCategoryInGuild } from "./userHasRoleCategoryInGuild.js";
import { ROLE_CATEGORY_QUEUE_ADMIN } from "./RoleCategories.js";

export async function userIsAdminForQueueInGuild(
	user: Discord.User,
	guild: Discord.Guild
): Promise<boolean> {
	return await userHasRoleCategoryInGuild(user, ROLE_CATEGORY_QUEUE_ADMIN, guild);
}
