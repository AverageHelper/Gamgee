import type { QueueConfig as _QueueConfig, QueueEntry as _QueueEntry, User } from "@prisma/client";
import type { Snowflake, TextChannel } from "discord.js";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library.js";
import { useLogger } from "./logger.js";
import { useRepository } from "./database/useDatabase.js";

const logger = useLogger();

export type QueueEntry = Readonly<_QueueEntry> & {
	readonly haveCalledNowPlaying: ReadonlyArray<Readonly<User>>;
};
export type UnsentQueueEntry = Omit<
	Readonly<_QueueEntry>,
	"queueMessageId" | "isDone" | "channelId" | "guildId" | "sentAt" | "haveCalledNowPlaying"
>;

// TODO: Break these into separate files where appropriate
// TODO: Only retain user-provided data for at most 90 days

// ** Queue Config **

export type QueueConfig = Readonly<_QueueConfig> & {
	readonly blacklistedUsers: ReadonlyArray<Readonly<User>>;
};

/**
 * Retrieves the queue's configuration settings from the database.
 *
 * @param queueChannel The channel that identifies the request queue.
 *
 * @returns a promise that resolves with the queue config for the channel
 * or a default one if none has been set yet.
 */
export async function getStoredQueueConfig(queueChannel: TextChannel): Promise<QueueConfig> {
	const extantConfig = await useRepository("queueConfig", queueConfigs =>
		queueConfigs.findUnique({
			where: { channelId: queueChannel.id },
			include: {
				blacklistedUsers: {
					include: { user: true }
				}
			}
		})
	);
	return {
		blacklistedUsers: extantConfig?.blacklistedUsers.map(u => u.user) ?? [],
		channelId: queueChannel.id,
		cooldownSeconds: extantConfig?.cooldownSeconds ?? null,
		entryDurationMaxSeconds: extantConfig?.entryDurationMaxSeconds ?? null,
		entryDurationMinSeconds: extantConfig?.entryDurationMinSeconds ?? null,
		queueDurationSeconds: extantConfig?.queueDurationSeconds ?? null,
		submissionMaxQuantity: extantConfig?.submissionMaxQuantity ?? null
	};
}

/**
 * Updates the provided properties of a queue's configuration settings
 * in the database.
 *
 * Does not modify the `blacklistedUsers` column. If you wish to do that,
 * use either {@link saveUserToStoredBlacklist} or
 * {@link removeUserFromStoredBlacklist}.
 *
 * @param config Properties of the queue config to overwrite the current data.
 * @param queueChannel The channel that identifies the request queue.
 */
export async function updateStoredQueueConfig(
	config: Partial<Readonly<_QueueConfig>>,
	queueChannel: TextChannel
): Promise<void> {
	if (Object.keys(config).length === 0) return; // nothing to store

	// Compose updates
	const update: Partial<_QueueConfig> = {
		cooldownSeconds: config.cooldownSeconds,
		entryDurationMaxSeconds: config.entryDurationMaxSeconds,
		entryDurationMinSeconds: config.entryDurationMinSeconds,
		queueDurationSeconds: config.queueDurationSeconds,
		submissionMaxQuantity: config.submissionMaxQuantity
	};

	// Update or create the config
	await useRepository("queueConfig", configs =>
		configs.upsert({
			where: { channelId: queueChannel.id },
			update,
			create: {
				channelId: queueChannel.id,
				...update
			}
		})
	);
}

// ** Write Song Entries **

/**
 * Adds a queue entry to the database. Does NOT check for adjacent concerns,
 * like whether the guild has a config, whether that config marks the queue
 * as "open", or whether the queue's config and limits are defined.
 *
 * @param entry Properties of the new request entity.
 * @param queueChannel The channel that identifies the request queue.
 *
 * @returns a promise that resolves with the new queue entry
 */
export async function saveNewEntryToDatabase(
	entry: Omit<Readonly<_QueueEntry>, "channelId" | "guildId">,
	queueChannel: TextChannel
): Promise<QueueEntry> {
	// Make sure the channel is in there
	await useRepository("channel", channels =>
		channels.upsert({
			where: { id: queueChannel.id },
			update: {},

			create: {
				guildId: queueChannel.guildId,
				id: queueChannel.id
			}
		})
	);

	const newEntry = {
		channelId: queueChannel.id,
		guildId: queueChannel.guildId,
		isDone: entry.isDone,
		queueMessageId: entry.queueMessageId,
		seconds: entry.seconds,
		senderId: entry.senderId,
		sentAt: entry.sentAt,
		url: entry.url
	};

	// Add the entry, or update the one we have
	return await useRepository("queueEntry", queueEntries =>
		queueEntries.upsert({
			where: {
				queueMessageId: entry.queueMessageId
			},
			update: newEntry,

			create: newEntry,

			include: { haveCalledNowPlaying: true }
		})
	);
}

/**
 * Erases the queue entry from the database.
 *
 * @param queueMessageId The ID of the message that identifies the entry in the queue channel.
 */
export async function deleteStoredEntry(queueMessageId: Snowflake): Promise<void> {
	await useRepository("queueEntry", queueEntries =>
		queueEntries.delete({
			where: { queueMessageId }
		})
	);
}

// ** Read Song Entries **

/**
 * Retrieves an entry from the database with the given message ID.
 *
 * @param queueMessageId The ID of the message that identifies the entry in the queue channel.
 *
 * @returns a promise that resolves with the matching queue entry
 * or `null` if no such entry exists
 */
export async function getStoredEntry(queueMessageId: Snowflake): Promise<QueueEntry | null> {
	return await useRepository("queueEntry", queueEntries =>
		queueEntries.findUnique({
			where: { queueMessageId },
			include: { haveCalledNowPlaying: true }
		})
	);
}

/**
 * Retrieves all queue entries, in chronological order, from the database.
 *
 * @param queueChannel The channel that identifies the request queue.
 * @returns a promise that resolves with the queue's entries,
 * in the order in which they were added.
 */
export async function getAllStoredEntries(queueChannel: TextChannel): Promise<Array<QueueEntry>> {
	return await useRepository("queueEntry", queueEntries =>
		queueEntries.findMany({
			where: {
				channelId: queueChannel.id,
				guildId: queueChannel.guild.id
			},
			orderBy: { sentAt: "asc" },
			include: { haveCalledNowPlaying: true }
		})
	);
}

/**
 * Retrieves the number of queue entries stored in the database.
 *
 * @param queueChannel The channel that identifies the request queue.
 * @returns a promise that resolves with the number of entries in the queue.
 */
export async function countAllStoredEntries(queueChannel: TextChannel): Promise<number> {
	return await useRepository("queueEntry", queueEntries =>
		queueEntries.count({
			where: {
				channelId: queueChannel.id,
				guildId: queueChannel.guildId
			}
		})
	);
}

/**
 * Retrieves all entries from the database that were sent by the given user.
 *
 * @param senderId The ID of the user who submitted entries.
 * @param queueChannel The channel that identifies the request queue.
 * @returns a promise that resolves with the user's entries,
 * in the order in which they were added.
 */
export async function getAllStoredEntriesFromSender(
	senderId: string,
	queueChannel: TextChannel
): Promise<Array<QueueEntry>> {
	return await useRepository("queueEntry", queueEntries =>
		queueEntries.findMany({
			where: {
				channelId: queueChannel.id,
				guildId: queueChannel.guild.id,
				senderId
			},
			orderBy: { sentAt: "asc" },
			include: { haveCalledNowPlaying: true }
		})
	);
}

/**
 * Retrieves the lastest entry from the database that was sent by the given user.
 *
 * @param senderId The ID of the user who submitted entries.
 * @param queueChannel The channel that identifies the request queue.
 * @returns a promise that resolves with the user's latest entry
 * or `null` if the user has no associated entries.
 */
export async function getLatestStoredEntryFromSender(
	senderId: string,
	queueChannel: TextChannel
): Promise<QueueEntry | null> {
	return await useRepository("queueEntry", queueEntries =>
		queueEntries.findFirst({
			where: {
				channelId: queueChannel.id,
				guildId: queueChannel.guild.id,
				senderId
			},
			orderBy: { sentAt: "desc" },
			include: { haveCalledNowPlaying: true }
		})
	);
}

/**
 * Retrieves the number of queue entries stored in the database that were sent
 * by the given user.
 *
 * @param senderId The ID of the user who submitted entries.
 * @param queueChannel The channel that identifies the request queue.
 *
 * @returns a promise that resolves with the number of entries in
 * the queue associated with the user.
 */
export async function countAllStoredEntriesFromSender(
	senderId: string,
	queueChannel: TextChannel
): Promise<number> {
	return await useRepository("queueEntry", queueEntries =>
		queueEntries.count({
			where: {
				channelId: queueChannel.id,
				guildId: queueChannel.guild.id,
				senderId
			}
		})
	);
}

/**
 * Sets the entry's "done" value in the database.
 *
 * @param isDone Whether the entry should be marked "done"
 * @param queueMessageId The ID of the message that identifies the entry in the queue channel.
 */
export async function updateStoredEntryIsDone(
	isDone: boolean,
	queueMessageId: Snowflake
): Promise<void> {
	logger.debug(`Marking entry ${queueMessageId} as ${isDone ? "" : "not "}done`);
	await useRepository("queueEntry", queueEntries =>
		queueEntries.update({
			where: { queueMessageId },
			data: { isDone }
		})
	);
}

/**
 * Deletes all request entries for this queue from the database.
 * @param queueChannel The channel that identifies the request queue.
 */
export async function deleteStoredEntriesForQueue(queueChannel: TextChannel): Promise<void> {
	await useRepository("queueEntry", queueEntries =>
		queueEntries.deleteMany({
			where: {
				channelId: queueChannel.id,
				guildId: queueChannel.guild.id
			}
		})
	);
}

// ** Now-playing Invocations **

/**
 * Increments the count of unique `/nowplaying` invocations in the database for
 * the entry in the database. If the user submitted this entry, they are not
 * counted. If the user has already invoked `/nowplaying` for this entry, they
 * are not counted.
 *
 * @param userId The ID of the user who invoked `/nowplaying`.
 * @param queueMessageId The ID of the message that identifies the entry in the queue channel.
 * @param queueChannel The channel that identifies the request queue.
 */
export async function addToHaveCalledNowPlayingForStoredEntry(
	userId: Snowflake,
	queueMessageId: Snowflake,
	queueChannel: TextChannel
): Promise<void> {
	logger.debug(`Adding ${userId} to haveCalledNowPlaying for ${queueMessageId}`);
	const entry = await useRepository("queueEntry", queueEntries =>
		queueEntries.findFirst({
			where: {
				channelId: queueChannel.id,
				guildId: queueChannel.guild.id,
				queueMessageId
			},
			select: { senderId: true, haveCalledNowPlaying: true }
		})
	);
	if (!entry) {
		logger.debug(`Could not find entry '${queueMessageId}' in the database!`);
		return;
	}
	if (userId === entry.senderId) {
		logger.debug("User calling is this request's sender, skipping");
		return;
	}
	if (entry?.haveCalledNowPlaying.map(u => u.id).includes(userId)) {
		logger.debug("User in haveCalledNowPlaying already, skipping...");
		return;
	}
	await useRepository("queueEntry", queueEntries =>
		queueEntries.update({
			where: { queueMessageId },
			data: {
				haveCalledNowPlaying: {
					connectOrCreate: {
						where: { id: userId },
						create: { id: userId }
					}
				}
			}
		})
	);
	logger.debug("User added to haveCalledNowPlaying");
}

// ** User Blacklist **

/**
 * Adds the user to the queue's blacklist in the database. That user will not
 * be able to submit song requests.
 *
 * @param userId The ID of the user to blacklist.
 * @param queueChannel The channel that identifies the request queue.
 */
export async function saveUserToStoredBlacklist(
	userId: Snowflake,
	queueChannel: TextChannel
): Promise<void> {
	const blacklistedUsers = {
		connectOrCreate: {
			where: {
				queueConfigsChannelId_userId: {
					queueConfigsChannelId: queueChannel.id,
					userId
				}
			},
			create: {
				user: {
					connectOrCreate: {
						where: { id: userId },
						create: { id: userId }
					}
				}
			}
		}
	};

	await useRepository("queueConfig", configs =>
		configs.upsert({
			// If a config is found, update it:
			where: { channelId: queueChannel.id },
			update: { blacklistedUsers },

			// If the queue config isn't found, create it:
			create: {
				channelId: queueChannel.id,
				blacklistedUsers
			}
		})
	);
}

/**
 * Removes the user from the queue's blacklist in the database.
 *
 * @param userId The ID of the user to whitelist.
 * @param queueChannel The channel that identifies the request queue.
 */
export async function removeUserFromStoredBlacklist(
	userId: Snowflake,
	queueChannel: TextChannel
): Promise<void> {
	await useRepository("queueConfigToBlacklistedUsers", async relation => {
		try {
			// Delete the relation, easy as that:
			await relation.delete({
				where: { queueConfigsChannelId_userId: { queueConfigsChannelId: queueChannel.id, userId } }
			});
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
				// Nothing to delete here! Move along
			} else {
				throw error;
			}
		}
	});
}
