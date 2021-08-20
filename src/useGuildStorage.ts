import type Discord from "discord.js";
import type { Snowflake } from "discord.js";
import { getEnv } from "./helpers/environment";
import { Guild, Role } from "./database/model";
import { useRepository, useTransaction } from "./database/useDatabase";

class GuildEntryManager {
	/** The guild. */
	public readonly guild: Discord.Guild;

	constructor(guild: Discord.Guild) {
		this.guild = guild;
	}

	/**
	 * Retrives the list of Discord Role IDs whose members have permission to manage
	 * the guild's queue limits, content, and open status.
	 */
	async getQueueAdminRoles(): Promise<Array<Snowflake>> {
		const storedAdminRoles = (
			await useRepository(Role, repo =>
				repo.find({
					where: {
						definesQueueAdmin: true,
						guildId: this.guild.id
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

	async addQueueAdminRole(roleId: Snowflake): Promise<void> {
		if (!roleId) return;

		const role = new Role(roleId, this.guild.id);
		role.definesQueueAdmin = true;
		await useRepository(Role, repo => repo.save(role));
	}

	/**
	 * Retrieves the list of Discord Role IDs whose members have
	 * permission to manage the guild.
	 */
	async getGuildAdminRoles(): Promise<Array<Snowflake>> {
		return (
			await useRepository(Role, repo =>
				repo.find({
					where: {
						definesGuildAdmin: true,
						guildId: this.guild.id
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

	async updateRole(
		roleId: Snowflake,
		attrs: Partial<Pick<Role, "definesGuildAdmin" | "definesQueueAdmin">>
	): Promise<void> {
		if (!roleId) return;
		if (attrs === {}) return;

		await useTransaction(async transaction => {
			const roles = transaction.getRepository(Role);
			const role =
				(await roles.findOne({
					where: {
						id: roleId,
						guildId: this.guild.id
					}
				})) ?? new Role(roleId, this.guild.id);

			role.definesGuildAdmin = attrs.definesGuildAdmin ?? role.definesGuildAdmin;
			role.definesQueueAdmin = attrs.definesQueueAdmin ?? role.definesQueueAdmin;

			await transaction.save(role);
		});
	}

	async removeRole(roleId: Snowflake): Promise<void> {
		if (!roleId) return;
		await useRepository(Role, repo => repo.delete({ id: roleId, guildId: this.guild.id }));
	}

	/** Retrieves the guild's queue channel ID, if it exists.. */
	async getQueueChannelId(): Promise<Snowflake | null> {
		const guildInfo = await useRepository(Guild, repo =>
			repo.findOne({
				where: {
					id: this.guild.id
				}
			})
		);
		return guildInfo?.currentQueue ?? null;
	}

	/** Sets the guild's queue channel. */
	async setQueueChannel(channel: Discord.TextChannel | Snowflake | null): Promise<void> {
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
					id: this.guild.id
				}
			});

			const newGuild = new Guild(this.guild.id, guildInfo?.isQueueOpen ?? false, currentQueue);
			await transaction.save(newGuild);
		});
	}

	/** Get's the queue's current open status. */
	async isQueueOpen(): Promise<boolean> {
		const guildInfo = await useRepository(Guild, repo =>
			repo.findOne({
				where: {
					id: this.guild.id
				}
			})
		);
		return guildInfo?.isQueueOpen ?? false;
	}

	/** Sets the guild's queue-open status. */
	async setQueueOpen(isOpen: boolean): Promise<void> {
		await useTransaction(async transaction => {
			const guilds = transaction.getRepository(Guild);
			const guildInfo = await guilds.findOne({
				where: {
					id: this.guild.id
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
			await guilds.update({ id: this.guild.id }, { isQueueOpen: isOpen });
		});
	}
}

export function useGuildStorage(guild: Discord.Guild): GuildEntryManager {
	return new GuildEntryManager(guild);
}
