import type Discord from "discord.js";
import type { EntityManager } from "typeorm";
import type { Snowflake } from "discord.js";
import { Channel, Guild, QueueConfig, QueueEntry, User } from "./database/model/index.js";
import { useRepository, useTransaction } from "./database/useDatabase.js";
import { useLogger } from "./logger.js";
import {
	DEFAULT_ENTRY_DURATION,
	DEFAULT_SUBMISSION_COOLDOWN,
	DEFAULT_SUBMISSION_MAX_QUANTITY
} from "./constants/queues.js";

const logger = useLogger();

export type { QueueEntry };
export type UnsentQueueEntry = Omit<
	QueueEntry,
	"queueMessageId" | "isDone" | "channelId" | "guildId" | "sentAt" | "haveCalledNowPlaying"
>;

// TODO: Break these into separate files where appropriate
// TODO: Make clear that these functions do not touch Discord's API, only local storage

// ** Queue Config **

/**
 * Retrieves the queue's configuration settings.
 *
 * @param queueChannel The channel that identifies the request queue.
 * @param transaction A database transaction. If not provided, a new one will be created to get the data.
 *
 * @returns a promise that resolves with the current {@link QueueConfig}
 * or a default one if none has been set yet.
 */
export async function getQueueConfig(
	queueChannel: Discord.TextChannel,
	transaction?: EntityManager
): Promise<QueueConfig> {
	const repo = transaction?.getRepository(QueueConfig) ?? QueueConfig;
	const channelId = queueChannel.id;
	const defaultConfig = (): QueueConfig =>
		new QueueConfig(channelId, {
			entryDurationSeconds: DEFAULT_ENTRY_DURATION,
			cooldownSeconds: DEFAULT_SUBMISSION_COOLDOWN,
			submissionMaxQuantity: DEFAULT_SUBMISSION_MAX_QUANTITY,
			blacklistedUsers: []
		});

	return useRepository(repo, async repo => {
		return (await repo.findOne({ where: { channelId } })) ?? defaultConfig();
	});
}

/**
 * Updates the provided properties of a queue's configuration settings.
 *
 * @param config Properties of the queue config to overwrite the current data.
 * @param queueChannel The channel that identifies the request queue.
 */
export async function updateQueueConfig(
	config: Partial<QueueConfig>,
	queueChannel: Discord.TextChannel
): Promise<void> {
	await useTransaction(async transaction => {
		const oldConfig = await getQueueConfig(queueChannel, transaction);

		let entryDurationSeconds: number | null;
		if (config.entryDurationSeconds === undefined) {
			entryDurationSeconds = oldConfig.entryDurationSeconds;
		} else {
			entryDurationSeconds = config.entryDurationSeconds;
		}

		let cooldownSeconds: number | null;
		if (config.cooldownSeconds === undefined) {
			cooldownSeconds = oldConfig.cooldownSeconds;
		} else {
			cooldownSeconds = config.cooldownSeconds;
		}

		let submissionMaxQuantity: number | null;
		if (config.submissionMaxQuantity === undefined) {
			submissionMaxQuantity = oldConfig.submissionMaxQuantity;
		} else {
			submissionMaxQuantity = config.submissionMaxQuantity;
		}

		let blacklistedUsers: Array<User>;
		if (config.blacklistedUsers === undefined) {
			blacklistedUsers = oldConfig.blacklistedUsers;
		} else {
			blacklistedUsers = config.blacklistedUsers;
		}

		const newConfig = new QueueConfig(queueChannel.id, {
			entryDurationSeconds,
			cooldownSeconds,
			submissionMaxQuantity,
			blacklistedUsers
		});
		await transaction.save(newConfig);
	});
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
	entry: Omit<QueueEntry, "channelId" | "guildId">,
	queueChannel: Discord.TextChannel
): Promise<QueueEntry> {
	return useTransaction(async transaction => {
		const guilds = transaction.getRepository(Guild);
		const queueConfigs = transaction.getRepository(QueueConfig);

		// Make sure the guild and channels are in there
		const guild =
			(await guilds.findOne({
				where: {
					id: queueChannel.guild.id
				}
			})) ?? new Guild(queueChannel.guild.id, false, queueChannel.id);
		await transaction.save(guild);

		const channel = new Channel(queueChannel.id, queueChannel.guild.id);
		await transaction.save(channel);

		// Make sure we have at least the default config
		const defaultConfig = (): QueueConfig =>
			new QueueConfig(queueChannel.id, {
				entryDurationSeconds: DEFAULT_ENTRY_DURATION,
				cooldownSeconds: DEFAULT_SUBMISSION_COOLDOWN,
				submissionMaxQuantity: DEFAULT_SUBMISSION_MAX_QUANTITY,
				blacklistedUsers: []
			});
		const channelId = queueChannel.id;
		const config = (await queueConfigs.findOne({ where: { channelId } })) ?? defaultConfig();

		await transaction.save(config);

		// Add the entry
		const queueEntries = transaction.getRepository(QueueEntry);
		const queueEntry = new QueueEntry(queueChannel.id, queueChannel.guild.id, entry);
		return queueEntries.save(queueEntry);
	});
}

/**
 * Removes the queue entry from the database.
 *
 * @param queueMessageId The ID of the message that identifies the entry in the queue channel.
 * @param queueChannel The channel that identifies the request queue.
 */
export async function removeEntryFromMessage(
	queueMessageId: Snowflake,
	queueChannel: Discord.TextChannel
): Promise<void> {
	await useRepository(QueueEntry, repo =>
		repo.delete({
			channelId: queueChannel.id,
			guildId: queueChannel.guild.id,
			queueMessageId
		})
	);
}

// ** Read Song Entries **

/**
 * Fetches an entry with the given message ID.
 *
 * @param queueMessageId The ID of the message that identifies the entry in the queue channel.
 * @param queueChannel The channel that identifies the request queue.
 *
 * @returns a promise that resolves with the matching queue entry
 * or `null` if no such entry exists
 */
export async function fetchEntryFromMessage(
	queueMessageId: Snowflake,
	queueChannel: Discord.TextChannel
): Promise<QueueEntry | null> {
	return useRepository(QueueEntry, async repo => {
		const doc = await repo.findOne({
			where: {
				channelId: queueChannel.id,
				guildId: queueChannel.guild.id,
				queueMessageId
			}
		});
		return doc ?? null;
	});
}

/**
 * Fetches all entries in the queue, in order of appearance.
 *
 * @param queueChannel The channel that identifies the request queue.
 * @returns a promise that resolves with the queue's entries,
 * in the order in which they were added.
 */
export async function fetchAllEntries(
	queueChannel: Discord.TextChannel
): Promise<Array<QueueEntry>> {
	return useRepository(QueueEntry, repo =>
		repo.find({
			where: {
				channelId: queueChannel.id,
				guildId: queueChannel.guild.id
			},
			order: { sentAt: "ASC" }
		})
	);
}

/**
 * Fetches the number of entries in the queue.
 *
 * @param queueChannel The channel that identifies the request queue.
 * @returns a promise that resolves with the number of entries in the queue.
 */
export async function countAllEntries(queueChannel: Discord.TextChannel): Promise<number> {
	return useRepository(QueueEntry, repo =>
		repo.count({
			where: {
				channelId: queueChannel.id,
				guildId: queueChannel.guild.id
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
	queueChannel: Discord.TextChannel
): Promise<Array<QueueEntry>> {
	return useRepository(QueueEntry, repo =>
		repo.find({
			where: {
				channelId: queueChannel.id,
				guildId: queueChannel.guild.id,
				senderId
			},
			order: { sentAt: "ASC" }
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
	queueChannel: Discord.TextChannel
): Promise<QueueEntry | null> {
	const entry = await useRepository(QueueEntry, repo =>
		repo.findOne({
			where: {
				channelId: queueChannel.id,
				guildId: queueChannel.guild.id,
				senderId
			},
			order: { sentAt: "DESC" }
		})
	);
	return entry ?? null;
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
	queueChannel: Discord.TextChannel
): Promise<number> {
	return useRepository(QueueEntry, repo =>
		repo.count({
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
	queueChannel: Discord.TextChannel
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
 * @param queueChannel The channel that identifies the request queue.
 */
export async function markEntryDone(
	isDone: boolean,
	queueMessageId: Snowflake,
	queueChannel: Discord.TextChannel
): Promise<void> {
	logger.debug(`Marking entry ${queueMessageId} as ${isDone ? "" : "not "}done`);
	await useRepository(QueueEntry, repo =>
		repo.update(
			{
				channelId: queueChannel.id,
				guildId: queueChannel.guild.id,
				queueMessageId
			},
			{ isDone }
		)
	);
}

/**
 * Deletes all request entries for this queue from the database.
 * @param queueChannel The channel that identifies the request queue.
 */
export async function clearEntries(queueChannel: Discord.TextChannel): Promise<void> {
	await useRepository(QueueEntry, repo =>
		repo.delete({
			channelId: queueChannel.id,
			guildId: queueChannel.guild.id
		})
	);
}

// ** Now-playing Invocations **

/**
 * Retrieves the number of users that invoked `/now-playing` or its variants for an entry,
 * excluding the requesting user if they also invoked that command.
 *
 * @param queueMessageId The ID of the message that identifies the entry in the queue channel.
 * @param queueChannel The channel that identifies the request queue.
 * @returns a promise that resolves with the number of unique `/now-playing` invocations
 * for the entry.
 */
export async function getLikeCount(
	queueMessageId: Snowflake,
	queueChannel: Discord.TextChannel
): Promise<number> {
	logger.debug(queueChannel.id);
	logger.debug(queueChannel.guild.id);
	logger.debug(queueMessageId);
	const entry = await useRepository(QueueEntry, repo =>
		repo.findOne({
			where: {
				channelId: queueChannel.id,
				guildId: queueChannel.guild.id,
				queueMessageId
			}
		})
	);
	logger.debug(entry);
	return entry?.haveCalledNowPlaying.length ?? Number.NaN;
}

/**
 * Increments the count of unique `/now-playing` invocations for the entry.
 * If the user submitted this entry, they are not counted.
 * If the user has already invoked `/now-playing` for this entry, they are not counted.
 *
 * @param userId The ID of the user who invoked `/now-playing`.
 * @param queueMessageId The ID of the message that identifies the entry in the queue channel.
 * @param queueChannel The channel that identifies the request queue.
 */
export async function addToHaveCalledNowPlaying(
	userId: Snowflake,
	queueMessageId: Snowflake,
	queueChannel: Discord.TextChannel
): Promise<void> {
	logger.debug(`Adding ${userId} to haveCalledNowPlaying for ${queueMessageId}`);
	const entry = await useRepository(QueueEntry, repo =>
		repo.findOne({
			where: {
				channelId: queueChannel.id,
				guildId: queueChannel.guild.id,
				queueMessageId
			}
		})
	);
	if (!entry) {
		logger.debug(`Could not find ${queueMessageId} in the queue message database!`);
		return;
	}
	if (userId === entry.senderId) {
		logger.debug(`User calling is this request's sender, skipping`);
		return;
	}
	if (entry?.haveCalledNowPlaying.includes(userId)) {
		logger.debug(`User in haveCalledNowPlaying already, skipping...`);
		return;
	}
	entry.haveCalledNowPlaying.push(userId);
	await useRepository(QueueEntry, repo =>
		repo.update(
			{
				channelId: queueChannel.id,
				guildId: queueChannel.guild.id,
				queueMessageId
			},
			{ haveCalledNowPlaying: entry.haveCalledNowPlaying }
		)
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
export async function blacklistUser(
	userId: Snowflake,
	queueChannel: Discord.TextChannel
): Promise<void> {
	await useTransaction(async transaction => {
		const queue = await getQueueConfig(queueChannel, transaction);

		// The user is already blacklisted
		if (queue.blacklistedUsers.some(user => user.id === userId)) return;
		const users = transaction.getRepository(User);

		// Add the user to the blacklist
		let newUser = await users.findOne(userId);

		if (!newUser) {
			newUser = new User(userId);
			users.create(newUser);
		}
		if (!queue.blacklistedUsers.some(user => user.id === userId)) {
			queue.blacklistedUsers.push(newUser);
		}

		await transaction.save(queue);
	});
}

/**
 * Removes the user from the queue's blacklist.
 *
 * @param userId The ID of the user to whitelist.
 * @param queueChannel The channel that identifies the request queue.
 */
export async function whitelistUser(
	userId: Snowflake,
	queueChannel: Discord.TextChannel
): Promise<void> {
	await useTransaction(async transaction => {
		const queue = await getQueueConfig(queueChannel, transaction);

		queue.blacklistedUsers = queue.blacklistedUsers.filter(user => user.id !== userId);
		// TODO: Make sure this actually saves. (We used to call `save` on the repo iteself)
		await transaction.save(queue);
	});
}
