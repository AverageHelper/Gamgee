import type { ApplicationCommandPermissions, Guild, Snowflake } from "discord.js";
import { ApplicationCommandPermissionType } from "discord.js";
import { getGuildAdminRoles, getQueueAdminRoles } from "../useGuildStorage.js";

export interface CommandPermission extends ApplicationCommandPermissions {
	/** The `id` of the role or user */
	id: Snowflake;

	type: ApplicationCommandPermissionType;

	/** `true` to allow, `false` to disallow */
	permission: boolean;
}

/**
 * Creates a `CommandPermission` that describes the type of access
 * that a guild owner has to a command.
 *
 * @param guild The guild whose owner to allow or disallow.
 * @param permission Whether the owner should be permitted or prevented
 *  from using the command.
 *
 * @returns a new `CommandPermission` that describes the type of access
 * that a guild owner has to a command.
 */
export function guildOwnerPermission(guild: Guild, permission: boolean): CommandPermission {
	return {
		permission,
		type: ApplicationCommandPermissionType.User,
		id: guild.ownerId
	};
}

/**
 * Creates an array of `CommandPermission`s that describe the type of access
 * that members of a guild's admin roles have to a command.
 *
 * @param guild The guild whose members to allow or disallow.
 * @param permission Whether the role members should be permitted or prevented
 *  from using the command.
 *
 * @returns an array of `CommandPermission`s that describe the type of access
 * that members of a guild's admin roles have to a command.
 */
export async function adminRolePermissions(
	guild: Guild,
	permission: boolean
): Promise<Array<CommandPermission>> {
	const knownAdminRoleIDs = await getGuildAdminRoles(guild);
	return knownAdminRoleIDs.filter(id => id).map(id => rolePermission(id, permission));
}

/**
 * Creates an array of `CommandPermission`s that describe the type of access
 * that members of a guild's queue-admin roles have to a command.
 *
 * @param guild The guild whose members to allow or disallow.
 * @param permission Whether the role members should be permitted or prevented
 *  from using the command.
 *
 * @returns an array of `CommandPermission`s that describe the type of access
 * that members of a guild's queue-admin roles have to a command.
 */
export async function queueAdminRolePermissions(
	guild: Guild,
	permission: boolean
): Promise<Array<CommandPermission>> {
	const knownRoleIDs = await getQueueAdminRoles(guild);
	return knownRoleIDs.filter(id => id).map(id => rolePermission(id, permission));
}

/**
 * Creates a `CommandPermission` that describes the type of access
 * that members of a guild role have to a command.
 *
 * @param roleId The ID of a guild role whose members should be allowed or disallowed.
 * @param permission Whether the role members should be permitted or prevented
 *  from using the command.
 *
 * @returns a new `CommandPermission` that describes the type of access
 * that members of a guild role have to a command.
 */
export function rolePermission(roleId: Snowflake, permission: boolean = true): CommandPermission {
	return {
		permission,
		type: ApplicationCommandPermissionType.Role,
		id: roleId
	};
}

export type PermissionAlias = "owner" | "admin" | "queue-admin";

export async function resolvePermissions(
	aliases: Array<PermissionAlias>,
	guild: Guild
): Promise<Array<CommandPermission>> {
	const result: Array<CommandPermission> = [];

	const uniqueAliases = new Set(aliases);
	for (const permAlias of uniqueAliases) {
		switch (permAlias) {
			case "owner":
				result.push(guildOwnerPermission(guild, true));
				break;

			case "admin":
				result.push(...(await adminRolePermissions(guild, true)));
				break;

			case "queue-admin":
				result.push(...(await queueAdminRolePermissions(guild, true)));
				break;
		}
	}

	return result;
}
