import type { Guild, Snowflake, TextChannel } from "discord.js";
import type { Role } from "@prisma/client";
import { DEFAULT_MESSAGE_COMMAND_PREFIX } from "./constants/database.js";
import { getEnv } from "./helpers/environment.js";
import { Prisma } from "@prisma/client";
import { useRepository } from "./database/useDatabase.js";

/**
 * Retrives the list of Discord Role IDs whose members have permission to manage
 * the guild's queue limits, content, and open status.
 */
export async function getQueueAdminRoles(guild: Guild): Promise<Array<Snowflake>> {
	const storedAdminRoles = (
		await useRepository("role", roles =>
			roles.findMany({
				where: {
					definesQueueAdmin: true,
					guildId: guild.id
				},
				select: { id: true }
			})
		)
	).map(role => role.id);
	return storedAdminRoles.concat([
		getEnv("EVENTS_ROLE_ID") ?? "0" /* as Snowflake*/, //
		getEnv("QUEUE_ADMIN_ROLE_ID") ?? "0" /* as Snowflake*/ //
		// getEnv("BOT_ADMIN_ROLE_ID") ?? "0" /* as Snowflake*/
	]);
}

/**
 * Retrieves the list of Discord Role IDs whose members have
 * permission to manage the guild.
 */
export async function getGuildAdminRoles(guild: Guild): Promise<Array<Snowflake>> {
	return (
		await useRepository("role", roles =>
			roles.findMany({
				where: {
					definesGuildAdmin: true,
					guildId: guild.id
				},
				select: { id: true }
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
	attrs: Partial<Pick<Readonly<Role>, "definesGuildAdmin" | "definesQueueAdmin">>,
	guild: Guild
): Promise<void> {
	if (!roleId) return;
	if (Object.keys(attrs).length === 0) return; // nothing to update

	const update: Partial<Pick<Role, "definesGuildAdmin" | "definesQueueAdmin">> = {
		definesGuildAdmin: attrs.definesGuildAdmin,
		definesQueueAdmin: attrs.definesQueueAdmin
	};

	await useRepository("role", roles =>
		roles.upsert({
			where: { id: roleId },
			update,

			create: {
				definesGuildAdmin: attrs.definesGuildAdmin ?? false,
				definesQueueAdmin: attrs.definesQueueAdmin ?? false,
				guildId: guild.id,
				id: roleId
			}
		})
	);
}

/** Removes the role from the database. */
export async function removeRole(roleId: Snowflake): Promise<void> {
	if (!roleId) return;
	await useRepository("role", roles =>
		roles.delete({
			where: { id: roleId }
		})
	);
}

/** Retrieves the guild's queue channel ID, if it exists. */
export async function getQueueChannelId(guild: Guild): Promise<Snowflake | null> {
	const guildInfo = await useRepository("guild", guilds =>
		guilds.findUnique({
			where: { id: guild.id },
			select: { currentQueue: true }
		})
	);
	return guildInfo?.currentQueue ?? null;
}

/** Sets the guild's queue channel. */
export async function setQueueChannel(
	channel: TextChannel | Snowflake | null,
	guild: Guild
): Promise<void> {
	let currentQueue: Snowflake | null;

	if (channel === null || typeof channel === "string") {
		currentQueue = channel;
	} else {
		currentQueue = channel.id;
	}

	await useRepository("guild", guilds =>
		guilds.upsert({
			where: { id: guild.id },
			update: { currentQueue },

			create: {
				currentQueue,
				id: guild.id,
				isQueueOpen: false,
				messageCommandPrefix: DEFAULT_MESSAGE_COMMAND_PREFIX
			}
		})
	);
}

/** Retrieves the guild's message command prefix. */
export async function getCommandPrefix(guild: Guild | null | undefined): Promise<string> {
	if (!guild?.id) return DEFAULT_MESSAGE_COMMAND_PREFIX;
	const guildInfo = await useRepository("guild", guilds =>
		guilds.findUnique({
			where: { id: guild.id },
			select: { messageCommandPrefix: true }
		})
	);
	return guildInfo?.messageCommandPrefix ?? DEFAULT_MESSAGE_COMMAND_PREFIX;
}

/** Sets the guild's message command prefix. */
export async function setCommandPrefix(guild: Guild, messageCommandPrefix: string): Promise<void> {
	if (!messageCommandPrefix) throw new TypeError("New prefix cannot be empty");

	await useRepository("guild", guilds =>
		guilds.upsert({
			where: { id: guild.id },
			update: { messageCommandPrefix },

			create: {
				currentQueue: null,
				id: guild.id,
				isQueueOpen: false,
				messageCommandPrefix
			}
		})
	);
}

/** Get's the queue's current open status. */
export async function isQueueOpen(guild: Guild): Promise<boolean> {
	const guildInfo = await useRepository("guild", guilds =>
		guilds.findUnique({
			where: { id: guild.id },
			select: { isQueueOpen: true }
		})
	);
	return guildInfo?.isQueueOpen ?? false;
}

/** Sets the guild's queue-open status. */
export async function setQueueOpen(isQueueOpen: boolean, guild: Guild): Promise<void> {
	await useRepository("guild", async guilds => {
		try {
			// Attempt to update row
			await guilds.update({
				where: { id: guild.id },
				data: { isQueueOpen }
			});
		} catch (error) {
			// Throw unknown errors
			if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2025")
				throw error;

			// Handle Prisma error about unknown row
			throw new Error("Cannot open a queue without a queue to open.");
		}
	});
}
