import type Discord from "discord.js";
import type { EntityManager, Repository } from "typeorm";
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

// ** Queue Config **

/**
 * Retrieves the queue's configuration settings.
 *
 * @param queueChannel The channel that identifies the request queue.
 * @param transaction A database transaction. If not provided, a new one will be created to get the data.
 *
 * @returns the current {@link QueueConfig}, or a default one if none has been set yet.
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

// ** Song Entries **

/**
 * Adds the queue entry to the database.
 *
 * @param entry Properties of the new request entity.
 * @param queueChannel The channel that identifies the request queue.
 *
 * @returns the new queue entry
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
		const config =
			(await queueConfigs.findOne({
				where: {
					channelId: queueChannel.id
				}
			})) ??
			new QueueConfig(queueChannel.id, {
				entryDurationSeconds: DEFAULT_ENTRY_DURATION,
				cooldownSeconds: DEFAULT_SUBMISSION_COOLDOWN,
				submissionMaxQuantity: DEFAULT_SUBMISSION_MAX_QUANTITY,
				blacklistedUsers: []
			});
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

// ** Everything Else **

export class QueueEntryManager {
	/** The channel for this queue. */
	private readonly queueChannel: Discord.TextChannel;

	constructor(queueChannel: Discord.TextChannel) {
		this.queueChannel = queueChannel;
	}

	/** Fetches an entry with the given message ID. */
	async fetchEntryFromMessage(queueMessageId: string): Promise<QueueEntry | null> {
		return useRepository(QueueEntry, repo => this._getEntryWithMsgId(queueMessageId, repo));
	}

	/** Fetches all entries in queue order. */
	async fetchAll(): Promise<Array<QueueEntry>> {
		return useRepository(QueueEntry, repo =>
			repo.find({
				where: {
					channelId: this.queueChannel.id,
					guildId: this.queueChannel.guild.id
				},
				order: { sentAt: "ASC" }
			})
		);
	}

	/** Fetches the number of entries in the queue. */
	async countAll(): Promise<number> {
		return useRepository(QueueEntry, repo =>
			repo.count({
				where: {
					channelId: this.queueChannel.id,
					guildId: this.queueChannel.guild.id
				}
			})
		);
	}

	/** Fetches all entries by the given user in order of submission. */
	async fetchAllFrom(senderId: string): Promise<Array<QueueEntry>> {
		return useRepository(QueueEntry, repo =>
			repo.find({
				where: {
					channelId: this.queueChannel.id,
					guildId: this.queueChannel.guild.id,
					senderId
				},
				order: { sentAt: "ASC" }
			})
		);
	}

	/** Fetches the lastest entry by the given user. */
	async fetchLatestFrom(senderId: string): Promise<QueueEntry | null> {
		const entry = await useRepository(QueueEntry, repo =>
			repo.findOne({
				where: {
					channelId: this.queueChannel.id,
					guildId: this.queueChannel.guild.id,
					senderId
				},
				order: { sentAt: "DESC" }
			})
		);
		return entry ?? null;
	}

	/** Fetches the number of entries from the given user in the queue. */
	async countAllFrom(senderId: string): Promise<number> {
		return useRepository(QueueEntry, repo =>
			repo.count({
				where: {
					channelId: this.queueChannel.id,
					guildId: this.queueChannel.guild.id,
					senderId
				}
			})
		);
	}

	/** Sets the entry's "done" value. */
	async markEntryDone(isDone: boolean, queueMessageId: Snowflake): Promise<void> {
		logger.debug(`Marking entry ${queueMessageId} as ${isDone ? "" : "not "}done`);
		await useRepository(QueueEntry, repo =>
			repo.update(
				{
					channelId: this.queueChannel.id,
					guildId: this.queueChannel.guild.id,
					queueMessageId
				},
				{ isDone }
			)
		);
	}

	async getLikeCount(queueMessageId: Snowflake): Promise<number> {
		logger.debug(this.queueChannel.id);
		logger.debug(this.queueChannel.guild.id);
		logger.debug(queueMessageId);
		const entry = await useRepository(QueueEntry, repo =>
			repo.findOne({
				where: {
					channelId: this.queueChannel.id,
					guildId: this.queueChannel.guild.id,
					queueMessageId
				}
			})
		);
		logger.debug(entry);
		return entry?.haveCalledNowPlaying.length ?? Number.NaN;
	}

	async addToHaveCalledNowPlaying(userId: Snowflake, queueMessageId: Snowflake): Promise<void> {
		logger.debug(`Adding ${userId} to haveCalledNowPlaying for ${queueMessageId}`);
		const entry = await useRepository(QueueEntry, repo =>
			repo.findOne({
				where: {
					channelId: this.queueChannel.id,
					guildId: this.queueChannel.guild.id,
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
					channelId: this.queueChannel.id,
					guildId: this.queueChannel.guild.id,
					queueMessageId
				},
				{ haveCalledNowPlaying: entry.haveCalledNowPlaying }
			)
		);
		logger.debug("User added to haveCalledNowPlaying");
	}

	/** Delete all entries for this queue channel. */
	async clear(): Promise<void> {
		await useRepository(QueueEntry, repo =>
			repo.delete({
				channelId: this.queueChannel.id,
				guildId: this.queueChannel.guild.id
			})
		);
	}

	/** Adds the user to the queue's blacklist. That user will not be able to submit song requests. */
	async blacklistUser(userId: string): Promise<void> {
		// FIXME: Do we need to hit the database twice here?
		const config = await getQueueConfig(this.queueChannel);

		// The user is already blacklisted
		if (config.blacklistedUsers.some(user => user.id === userId)) return;

		// Add the user to the blacklist
		await useTransaction(async transaction => {
			const users = transaction.getRepository(User);

			const queue = await getQueueConfig(this.queueChannel, transaction);
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

	/** Removes the user from the queue's blacklist. */
	async whitelistUser(userId: string): Promise<void> {
		await useTransaction(async transaction => {
			const queue = await getQueueConfig(this.queueChannel, transaction);

			queue.blacklistedUsers = queue.blacklistedUsers.filter(user => user.id !== userId);
			// TODO: Make sure this actually saves. (We used to call `save` on the repo iteself)
			await transaction.save(queue);
		});
	}

	private async _getEntryWithMsgId(
		queueMessageId: string,
		repo: Repository<QueueEntry>
	): Promise<QueueEntry | null> {
		const doc = await repo.findOne({
			where: {
				channelId: this.queueChannel.id,
				guildId: this.queueChannel.guild.id,
				queueMessageId
			}
		});
		return doc ?? null;
	}
}

export function useQueueStorage(queueChannel: Discord.TextChannel): QueueEntryManager {
	return new QueueEntryManager(queueChannel);
}
