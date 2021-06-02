import type Discord from "discord.js";
import { useGuildStorage } from "../useGuildStorage";

export interface CommandPermission extends Discord.ApplicationCommandPermissionData {
	/** The `id` of the role or user */
	id: Discord.Snowflake;

	type: "ROLE" | "USER";

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
export function guildOwnerPermission(guild: Discord.Guild, permission: boolean): CommandPermission {
	return {
		permission,
		type: "USER",
		id: guild.ownerID
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
	guild: Discord.Guild,
	permission: boolean
): Promise<Array<CommandPermission>> {
	const knownAdminRoleIDs = await useGuildStorage(guild).getGuildAdminRoles();
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
	guild: Discord.Guild,
	permission: boolean
): Promise<Array<CommandPermission>> {
	const knownRoleIDs = await useGuildStorage(guild).getQueueAdminRoles();
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
export function rolePermission(roleId: string, permission: boolean = true): CommandPermission {
	return {
		permission,
		type: "ROLE",
		id: roleId
	};
}

export type PermissionAlias = "owner" | "admin" | "queue-admin";

export async function resolvePermissions(
	aliases: Array<PermissionAlias>,
	guild: Discord.Guild
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
