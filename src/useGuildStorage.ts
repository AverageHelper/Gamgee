import type Discord from "discord.js";
import type { Snowflake } from "discord.js";
import { getEnv } from "./helpers/environment";
import { Guild, Role } from "./database/model";
import { useRepository, useTransaction } from "./database/useDatabase";

/**
 * Retrives the list of Discord Role IDs whose members have permission to manage
 * the guild's queue limits, content, and open status.
 */
export async function getQueueAdminRoles(guild: Discord.Guild): Promise<Array<Snowflake>> {
	const storedAdminRoles = (
		await useRepository(Role, repo =>
			repo.find({
				where: {
					definesQueueAdmin: true,
					guildId: guild.id
				}
			})
		)
	).map(role => role.id);
	return storedAdminRoles.concat([
		getEnv("EVENTS_ROLE_ID") ?? "0" /* as Snowflake*/, //
		getEnv("QUEUE_ADMIN_ROLE_ID") ?? "0" /* as Snowflake*/ //
		// getEnv("BOT_ADMIN_ROLE_ID") ?? "0" /* as Snowflake*/
	]);
}

export async function addQueueAdminRole(roleId: Snowflake, guild: Discord.Guild): Promise<void> {
	if (!roleId) return;

	const role = new Role(roleId, guild.id);
	role.definesQueueAdmin = true;
	await useRepository(Role, repo => repo.save(role));
}

/**
 * Retrieves the list of Discord Role IDs whose members have
 * permission to manage the guild.
 */
export async function getGuildAdminRoles(guild: Discord.Guild): Promise<Array<Snowflake>> {
	return (
		await useRepository(Role, repo =>
			repo.find({
				where: {
					definesGuildAdmin: true,
					guildId: guild.id
				}
			})
		)
	)
		.map(role => role.id)
		.concat([
			getEnv("QUEUE_CREATOR_ROLE_ID") ?? "0" /* as Snowflake*/ //
			// getEnv("BOT_ADMIN_ROLE_ID") ?? "0" /* as Snowflake*/
		]);
}

export async function updateRole(
	roleId: Snowflake,
	attrs: Partial<Pick<Role, "definesGuildAdmin" | "definesQueueAdmin">>,
	guild: Discord.Guild
): Promise<void> {
	if (!roleId) return;
	if (attrs === {}) return;

	await useTransaction(async transaction => {
		const roles = transaction.getRepository(Role);
		const role =
			(await roles.findOne({
				where: {
					id: roleId,
					guildId: guild.id
				}
			})) ?? new Role(roleId, guild.id);

		role.definesGuildAdmin = attrs.definesGuildAdmin ?? role.definesGuildAdmin;
		role.definesQueueAdmin = attrs.definesQueueAdmin ?? role.definesQueueAdmin;

		await transaction.save(role);
	});
}

export async function removeRole(roleId: Snowflake, guild: Discord.Guild): Promise<void> {
	if (!roleId) return;
	await useRepository(Role, repo => repo.delete({ id: roleId, guildId: guild.id }));
}

/** Retrieves the guild's queue channel ID, if it exists. */
export async function getQueueChannelId(guild: Discord.Guild): Promise<Snowflake | null> {
	const guildInfo = await useRepository(Guild, repo =>
		repo.findOne({
			where: {
				id: guild.id
			}
		})
	);
	return guildInfo?.currentQueue ?? null;
}

/** Sets the guild's queue channel. */
export async function setQueueChannel(
	channel: Discord.TextChannel | Snowflake | null,
	guild: Discord.Guild
): Promise<void> {
	let currentQueue: Snowflake | null;

	if (channel === null || typeof channel === "string") {
		currentQueue = channel;
	} else {
		currentQueue = channel.id;
	}

	await useTransaction(async transaction => {
		const guilds = transaction.getRepository(Guild);
		const guildInfo = await guilds.findOne({
			where: {
				id: guild.id
			}
		});

		const newGuild = new Guild(guild.id, guildInfo?.isQueueOpen ?? false, currentQueue);
		await transaction.save(newGuild);
	});
}

/** Get's the queue's current open status. */
export async function isQueueOpen(guild: Discord.Guild): Promise<boolean> {
	const guildInfo = await useRepository(Guild, repo =>
		repo.findOne({
			where: {
				id: guild.id
			}
		})
	);
	return guildInfo?.isQueueOpen ?? false;
}

/** Sets the guild's queue-open status. */
export async function setQueueOpen(isOpen: boolean, guild: Discord.Guild): Promise<void> {
	await useTransaction(async transaction => {
		const guilds = transaction.getRepository(Guild);
		const guildInfo = await guilds.findOne({
			where: {
				id: guild.id
			}
		});
		if (
			isOpen &&
			(guildInfo?.currentQueue === undefined ||
				guildInfo.currentQueue === null ||
				!guildInfo.currentQueue)
		) {
			throw new Error("Cannot open a queue without a queue to open.");
		}
		await guilds.update({ id: guild.id }, { isQueueOpen: isOpen });
	});
}

// TODO: Rewrite this functionally

/**
 * @deprecated Import guild storage functions separately.
 */
class GuildEntryManager {
	/** The guild. */
	public readonly guild: Discord.Guild;

	constructor(guild: Discord.Guild) {
		this.guild = guild;
	}

	/**
	 * Retrives the list of Discord Role IDs whose members have permission to manage
	 * the guild's queue limits, content, and open status.
	 *
	 * @deprecated Import {@link getQueueAdminRoles} instead.
	 */
	async getQueueAdminRoles(): Promise<Array<Snowflake>> {
		return getQueueAdminRoles(this.guild);
	}

	/**
	 * @deprecated Import {@link addQueueAdminRole} instead.
	 */
	async addQueueAdminRole(roleId: Snowflake): Promise<void> {
		return addQueueAdminRole(roleId, this.guild);
	}

	/**
	 * Retrieves the list of Discord Role IDs whose members have
	 * permission to manage the guild.
	 *
	 * @deprecated Import {@link getGuildAdminRoles} instead.
	 */
	async getGuildAdminRoles(): Promise<Array<Snowflake>> {
		return getGuildAdminRoles(this.guild);
	}

	/**
	 * @deprecated Import {@link updateRole} instead.
	 */
	async updateRole(
		roleId: Snowflake,
		attrs: Partial<Pick<Role, "definesGuildAdmin" | "definesQueueAdmin">>
	): Promise<void> {
		return updateRole(roleId, attrs, this.guild);
	}

	/**
	 * @deprecated Import {@link removeRole} instead.
	 */
	async removeRole(roleId: Snowflake): Promise<void> {
		return removeRole(roleId, this.guild);
	}

	/**
	 * Retrieves the guild's queue channel ID, if it exists.
	 *
	 * @deprecated Import {@link getQueueChannelId} instead.
	 */
	async getQueueChannelId(): Promise<Snowflake | null> {
		return getQueueChannelId(this.guild);
	}

	/**
	 * Sets the guild's queue channel.
	 *
	 * @deprecated Import {@link setQueueChannel} instead.
	 */
	async setQueueChannel(channel: Discord.TextChannel | Snowflake | null): Promise<void> {
		return setQueueChannel(channel, this.guild);
	}

	/**
	 * Get's the queue's current open status.
	 *
	 * @deprecated Import {@link isQueueOpen} instead.
	 */
	async isQueueOpen(): Promise<boolean> {
		return isQueueOpen(this.guild);
	}

	/**
	 * Sets the guild's queue-open status.
	 *
	 * @deprecated Import {@link setQueueOpen} instead.
	 */
	async setQueueOpen(isOpen: boolean): Promise<void> {
		return setQueueOpen(isOpen, this.guild);
	}
}

/**
 * @deprecated Import guild storage functions separately.
 */
export function useGuildStorage(guild: Discord.Guild): GuildEntryManager {
	return new GuildEntryManager(guild);
}
