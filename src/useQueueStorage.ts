import type { Snowflake, TextChannel } from "discord.js";
import { DEFAULT_MESSAGE_COMMAND_PREFIX } from "./constants/database.js";
import { useLogger } from "./logger.js";
import { useRepository } from "./database/useDatabase.js";
import type {
	QueueConfig as _QueueConfig,
	QueueConfigToBlacklistedUsers,
	QueueEntry as _QueueEntry,
	User
} from "@prisma/client";

const logger = useLogger();

export type QueueEntry = _QueueEntry & { haveCalledNowPlaying: Array<User> };
export type UnsentQueueEntry = Omit<
	_QueueEntry,
	"queueMessageId" | "isDone" | "channelId" | "guildId" | "sentAt" | "haveCalledNowPlaying"
>;

// TODO: Break these into separate files where appropriate
// TODO: Make clear that these functions do not touch Discord's API, only local storage
// TODO: Only retain user-provided data for at most 90 days

// ** Queue Config **

export type QueueConfig = _QueueConfig & {
	blacklistedUsers: Array<User>;
};

/**
 * Retrieves the queue's configuration settings.
 *
 * @param queueChannel The channel that identifies the request queue.
 *
 * @returns a promise that resolves with the queue config for the channel
 * or a default one if none has been set yet.
 */
export async function getQueueConfig(queueChannel: TextChannel): Promise<QueueConfig> {
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
		channelId: queueChannel.id,
		entryDurationSeconds: extantConfig?.entryDurationSeconds ?? null,
		entryDurationMinSeconds: extantConfig?.entryDurationMinSeconds ?? null,
		queueDurationSeconds: extantConfig?.queueDurationSeconds ?? null,
		cooldownSeconds: extantConfig?.cooldownSeconds ?? null,
		submissionMaxQuantity: extantConfig?.submissionMaxQuantity ?? null,
		blacklistedUsers: extantConfig?.blacklistedUsers.map(u => u.user) ?? []
	};
}

/**
 * Updates the provided properties of a queue's configuration settings.
 *
 * @param config Properties of the queue config to overwrite the current data.
 * @param queueChannel The channel that identifies the request queue.
 */
export async function updateQueueConfig(
	config: Partial<QueueConfig>,
	queueChannel: TextChannel
): Promise<void> {
	if (Object.keys(config).length === 0) return; // nothing to store

	// Compose updates
	const update: Partial<_QueueConfig> & {
		blacklistedUsers?: {
			set: Array<{ queueConfigsChannelId_userId: QueueConfigToBlacklistedUsers }>;
		};
	} = {
		entryDurationSeconds: config.entryDurationSeconds,
		entryDurationMinSeconds: config.entryDurationMinSeconds,
		queueDurationSeconds: config.queueDurationSeconds,
		cooldownSeconds: config.cooldownSeconds,
		submissionMaxQuantity: config.submissionMaxQuantity
	};

	if (config.blacklistedUsers !== undefined) {
		update.blacklistedUsers = {
			set: config.blacklistedUsers.map(user => ({
				queueConfigsChannelId_userId: { queueConfigsChannelId: queueChannel.id, userId: user.id }
			}))
		};
	}

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
 * Adds the queue entry to the database.
 *
 * @param entry Properties of the new request entity.
 * @param queueChannel The channel that identifies the request queue.
 *
 * @returns a promise that resolves with the new queue entry
 */
export async function createEntry(
	entry: Omit<_QueueEntry, "channelId" | "guildId">,
	queueChannel: TextChannel
): Promise<QueueEntry> {
	// FIXME: These could be done all in one go if we used table relations properly

	// Make sure the guild config is in there
	await useRepository("guild", guilds =>
		guilds.upsert({
			where: { id: queueChannel.guildId },
			update: {},

			create: {
				currentQueue: queueChannel.id,
				id: queueChannel.guildId,
				isQueueOpen: false,
				messageCommandPrefix: DEFAULT_MESSAGE_COMMAND_PREFIX
			}
		})
	);

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

	// Make sure we have at least the default queue config
	await useRepository("queueConfig", queueConfigs =>
		queueConfigs.upsert({
			where: { channelId: queueChannel.id },
			update: {},

			create: {
				channelId: queueChannel.id,
				entryDurationSeconds: null,
				cooldownSeconds: null,
				submissionMaxQuantity: null,
				queueDurationSeconds: null,
				entryDurationMinSeconds: null,
				blacklistedUsers: undefined
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
 * Removes the queue entry from the database.
 *
 * @param queueMessageId The ID of the message that identifies the entry in the queue channel.
 */
export async function removeEntryFromMessage(queueMessageId: Snowflake): Promise<void> {
	await useRepository("queueEntry", queueEntries =>
		queueEntries.delete({
			where: { queueMessageId }
		})
	);
}

// ** Read Song Entries **

/**
 * Fetches an entry with the given message ID.
 *
 * @param queueMessageId The ID of the message that identifies the entry in the queue channel.
 *
 * @returns a promise that resolves with the matching queue entry
 * or `null` if no such entry exists
 */
export async function fetchEntryFromMessage(queueMessageId: Snowflake): Promise<QueueEntry | null> {
	return await useRepository("queueEntry", queueEntries =>
		queueEntries.findUnique({
			where: { queueMessageId },
			include: { haveCalledNowPlaying: true }
		})
	);
}

/**
 * Fetches all entries in the queue, in order of appearance.
 *
 * @param queueChannel The channel that identifies the request queue.
 * @returns a promise that resolves with the queue's entries,
 * in the order in which they were added.
 */
export async function fetchAllEntries(queueChannel: TextChannel): Promise<Array<QueueEntry>> {
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
 * Fetches the number of entries in the queue.
 *
 * @param queueChannel The channel that identifies the request queue.
 * @returns a promise that resolves with the number of entries in the queue.
 */
export async function countAllEntries(queueChannel: TextChannel): Promise<number> {
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
 * Fetches all entries by the given user.
 *
 * @param senderId The ID of the user who submitted entries.
 * @param queueChannel The channel that identifies the request queue.
 * @returns a promise that resolves with the user's entries,
 * in the order in which they were added.
 */
export async function fetchAllEntriesFrom(
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
 * Fetches the lastest entry by the given user.
 *
 * @param senderId The ID of the user who submitted entries.
 * @param queueChannel The channel that identifies the request queue.
 * @returns a promise that resolves with the user's latest entry
 * or `null` if the user has no associated entries.
 */
export async function fetchLatestEntryFrom(
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
 * Fetches the number of entries from the given user in the queue.
 *
 * @param senderId The ID of the user who submitted entries.
 * @param queueChannel The channel that identifies the request queue.
 *
 * @returns a promise that resolves with the number of entries in
 * the queue associated with the user.
 */
export async function countAllEntriesFrom(
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

/** Returns the average entry duration of the submissions of the user with the provided ID. */
export async function averageSubmissionPlaytimeForUser(
	userId: Snowflake,
	queueChannel: TextChannel
): Promise<number> {
	const entries = await fetchAllEntriesFrom(userId, queueChannel);
	let average = 0;

	entries.forEach(entry => {
		average += entry.seconds;
	});
	average /= entries.length;

	return average;
}

/**
 * Sets the entry's "done" value.
 *
 * @param isDone Whether the entry should be marked "done"
 * @param queueMessageId The ID of the message that identifies the entry in the queue channel.
 */
export async function markEntryDone(isDone: boolean, queueMessageId: Snowflake): Promise<void> {
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
export async function clearEntries(queueChannel: TextChannel): Promise<void> {
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
 * Retrieves the number of users that invoked `/nowplaying` or its variants for an entry,
 * excluding the requesting user if they also invoked that command.
 *
 * @param queueMessageId The ID of the message that identifies the entry in the queue channel.
 * @param queueChannel The channel that identifies the request queue.
 * @returns a promise that resolves with the number of unique `/nowplaying` invocations
 * for the entry.
 */
export async function getLikeCount(
	queueMessageId: Snowflake,
	queueChannel: TextChannel
): Promise<number> {
	const entry = await useRepository("queueEntry", queueEntries =>
		queueEntries.findFirst({
			where: {
				channelId: queueChannel.id,
				guildId: queueChannel.guild.id,
				queueMessageId
			},
			select: { haveCalledNowPlaying: true }
		})
	);
	return entry?.haveCalledNowPlaying.length ?? Number.NaN;
}

/**
 * Increments the count of unique `/nowplaying` invocations for the entry.
 * If the user submitted this entry, they are not counted.
 * If the user has already invoked `/nowplaying` for this entry, they are not counted.
 *
 * @param userId The ID of the user who invoked `/nowplaying`.
 * @param queueMessageId The ID of the message that identifies the entry in the queue channel.
 * @param queueChannel The channel that identifies the request queue.
 */
export async function addToHaveCalledNowPlaying(
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
					connect: {
						id: userId
					}
				}
			}
		})
	);
	logger.debug("User added to haveCalledNowPlaying");
}

// ** User Blacklist **

/**
 * Adds the user to the queue's blacklist. That user will not be able to submit song requests.
 *
 * @param userId The ID of the user to blacklist.
 * @param queueChannel The channel that identifies the request queue.
 */
export async function blacklistUser(userId: Snowflake, queueChannel: TextChannel): Promise<void> {
	const blacklistedUsers = {
		connectOrCreate: {
			where: {
				queueConfigsChannelId_userId: {
					queueConfigsChannelId: queueChannel.id,
					userId
				}
			},
			create: { userId } // the User to create if none were found to match the above reference
		}
	};

	await useRepository("queueConfig", queueConfigs =>
		queueConfigs.upsert({
			// If a config is found, update it:
			where: { channelId: queueChannel.id },
			update: { blacklistedUsers },

			// If the queue config isn't found, create it:
			create: {
				channelId: queueChannel.id,
				entryDurationSeconds: null,
				entryDurationMinSeconds: null,
				queueDurationSeconds: null,
				cooldownSeconds: null,
				submissionMaxQuantity: null,
				blacklistedUsers
			}
		})
	);
}

/**
 * Removes the user from the queue's blacklist.
 *
 * @param userId The ID of the user to whitelist.
 * @param queueChannel The channel that identifies the request queue.
 */
export async function whitelistUser(userId: Snowflake, queueChannel: TextChannel): Promise<void> {
	await useRepository("queueConfig", queueConfigs =>
		queueConfigs.update({
			where: { channelId: queueChannel.id },
			data: {
				blacklistedUsers: {
					disconnect: {
						queueConfigsChannelId_userId: {
							queueConfigsChannelId: queueChannel.id,
							userId
						}
					}
				}
			}
		})
	);
}
