import type { RoleCategory } from "./RoleCategories.js";
import {
	ROLE_CATEGORY_OWNER,
	ROLE_CATEGORY_QUEUE_ADMIN,
	ROLE_CATEGORY_GUILD_ADMIN
} from "./RoleCategories.js";
import type Discord from "discord.js";
import type { Snowflake } from "discord.js";
import { getGuildAdminRoles, getQueueAdminRoles } from "../useGuildStorage.js";
import { userHasOneOfRoles } from "./userHasOneOfRoles.js";

export async function userHasRoleCategoryInGuild(
	user: Discord.User,
	category: RoleCategory,
	guild: Discord.Guild
): Promise<boolean> {
	const isOwner = user.id === guild.ownerId;

	let knownAdminRoleIDs: ReadonlyArray<Snowflake>;

	switch (category) {
		case ROLE_CATEGORY_OWNER:
			return isOwner;

		case ROLE_CATEGORY_GUILD_ADMIN: {
			if (isOwner) return true; // Always true for owner
			knownAdminRoleIDs = await getGuildAdminRoles(guild);
			break;
		}

		case ROLE_CATEGORY_QUEUE_ADMIN: {
			if (isOwner) return true; // Always true for owner
			knownAdminRoleIDs = await getQueueAdminRoles(guild);
			break;
		}
	}

	// Always true for user with a whitelisted role
	return await userHasOneOfRoles(user, knownAdminRoleIDs, guild);
}
