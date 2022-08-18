import type Discord from "discord.js";
import type { Snowflake } from "discord.js";
import { DEFAULT_MESSAGE_COMMAND_PREFIX } from "./constants/database.js";
import { getEnv } from "./helpers/environment.js";
import { Guild, Role } from "./database/model/index.js";
import { useRepository, useTransaction } from "./database/useDatabase.js";

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
	const guildInfo = await useRepository(Guild, repo => repo.findOneBy({ id: guild.id }));
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
		const guildInfo = await guilds.findOneBy({ id: guild.id });

		const newGuild = new Guild(
			guild.id,
			guildInfo?.isQueueOpen ?? false,
			currentQueue,
			DEFAULT_MESSAGE_COMMAND_PREFIX
		);
		await transaction.save(newGuild);
	});
}

/** Retrieves the guild's message command prefix. */
export async function getCommandPrefix(guild: Discord.Guild | null | undefined): Promise<string> {
	if (!guild) return DEFAULT_MESSAGE_COMMAND_PREFIX;
	const guildInfo = await useRepository(Guild, repo => repo.findOneBy({ id: guild.id }));
	return guildInfo?.messageCommandPrefix ?? DEFAULT_MESSAGE_COMMAND_PREFIX;
}

/** Sets the guild's message command prefix. */
export async function setCommandPrefix(guild: Discord.Guild, newPrefix: string): Promise<void> {
	if (!newPrefix) throw new TypeError("New prefix cannot be empty");

	await useTransaction(async transaction => {
		const guilds = transaction.getRepository(Guild);
		const guildInfo = await guilds.findOneBy({ id: guild.id });

		const newGuild = new Guild(
			guild.id,
			guildInfo?.isQueueOpen ?? false,
			guildInfo?.currentQueue ?? null,
			newPrefix
		);
		await transaction.save(newGuild);
	});
}

/** Get's the queue's current open status. */
export async function isQueueOpen(guild: Discord.Guild): Promise<boolean> {
	const guildInfo = await useRepository(Guild, repo => repo.findOneBy({ id: guild.id }));
	return guildInfo?.isQueueOpen ?? false;
}

/** Sets the guild's queue-open status. */
export async function setQueueOpen(isOpen: boolean, guild: Discord.Guild): Promise<void> {
	await useTransaction(async transaction => {
		const guilds = transaction.getRepository(Guild);
		const guildInfo = await guilds.findOneBy({ id: guild.id });
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
