import type Discord from "discord.js";
import { userHasRoleCategoryInGuild } from "./userHasRoleCategoryInGuild";
import { ROLE_CATEGORY_GUILD_ADMIN } from "./RoleCategories";

export async function userIsGuildAdmin(user: Discord.User, guild: Discord.Guild): Promise<boolean> {
  return userHasRoleCategoryInGuild(user, ROLE_CATEGORY_GUILD_ADMIN, guild);
}
