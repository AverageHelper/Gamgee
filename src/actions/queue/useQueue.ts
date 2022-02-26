import type Discord from "discord.js";
import type { MessageButton } from "../../buttons";
import type { QueueConfig } from "../../database/model/QueueConfig";
import type { QueueEntry, QueueEntryManager, UnsentQueueEntry } from "../../useQueueStorage";
import { actionRow, DELETE_BUTTON, DONE_BUTTON, RESTORE_BUTTON } from "../../buttons";
import { addStrikethrough } from "./strikethroughText";
import { deleteMessage, editMessage, escapeUriInString } from "../messages";
import { useQueueStorage } from "../../useQueueStorage";
import durationString from "../../helpers/durationString";
import StringBuilder from "../../helpers/StringBuilder";

function queueMessageFromEntry(
	entry: Pick<QueueEntry, "isDone" | "senderId" | "seconds" | "url" | "haveCalledNowPlaying">
): Discord.MessageOptions {
	const contentBuilder = new StringBuilder();
	contentBuilder.push(`<@!${entry.senderId}>`);
	contentBuilder.push(" requested a song that's ");
	contentBuilder.pushBold(durationString(entry.seconds));
	contentBuilder.push(" long: ");

	// Suppress embeds if the entry is marked "Done"
	if (entry.isDone) {
		contentBuilder.push(escapeUriInString(entry.url));
	} else {
		contentBuilder.push(entry.url);
	}

	const likeCount = entry.haveCalledNowPlaying.length;
	contentBuilder.push(`\nIt has ${likeCount} like${likeCount === 1 ? "" : "s"}.`);

	// Strike the message through if the entry is marked "Done"
	const result = contentBuilder.result();
	const content = entry.isDone ? addStrikethrough(result) : result;

	// Only show the restore button if the entry is marked "Done"
	const entryButtons: NonEmptyArray<MessageButton> = entry.isDone
		? [RESTORE_BUTTON]
		: [DONE_BUTTON, DELETE_BUTTON];

	return {
		content,
		allowedMentions: { users: [] },
		components: [actionRow(entryButtons)]
	};
}

/**
 * A proxy for queue management and feedback. These methods may modify the
 * queue and manage messages in the queue channel.
 */
export class QueueManager {
	private readonly queueStorage: QueueEntryManager;
	private readonly queueChannel: Discord.TextChannel;

	constructor(queueStorage: QueueEntryManager, queueChannel: Discord.TextChannel) {
		this.queueStorage = queueStorage;
		this.queueChannel = queueChannel;
	}

	/** Retrieves the queue's configuration settings. */
	async getConfig(): Promise<QueueConfig> {
		return this.queueStorage.getConfig();
	}

	/** Updates the provided properties of a queue's configuration settings. */
	async updateConfig(config: Partial<QueueConfig>): Promise<void> {
		return this.queueStorage.updateConfig(config);
	}

	/** Retrieves the number of entries in the queue */
	async count(): Promise<number> {
		return this.queueStorage.countAll();
	}

	/** Retrieves the number of entries in the queue submitted by the given user. */
	async countFrom(userId: string): Promise<number> {
		return this.queueStorage.countAllFrom(userId);
	}

	/** Retrieves the playtime of the queue's unfinished entries. */
	async playtimeRemaining(): Promise<number> {
		const queue = await this.queueStorage.fetchAll();
		let duration = 0;
		queue
			.filter(e => !e.isDone)
			.forEach(e => {
				duration += e.seconds;
			});
		return duration;
	}

	/** Retrieves the total playtime of the queue's entries. */
	async playtimeTotal(): Promise<number> {
		const queue = await this.queueStorage.fetchAll();
		let duration = 0;
		queue.forEach(e => {
			duration += e.seconds;
		});
		return duration;
	}

	/** Retrieves the average playtime of the queue's entries. */
	async playtimeAverage(): Promise<number> {
		const queue = await this.queueStorage.fetchAll();
		let average = 0;
		queue.forEach(e => {
			average += e.seconds;
		});
		average /= queue.length;
		return average;
	}

	/** Adds an entry to the queue cache and sends the entry to the queue channel. */
	async push(newEntry: UnsentQueueEntry): Promise<QueueEntry> {
		const messageOptions = queueMessageFromEntry({
			...newEntry,
			isDone: false,
			haveCalledNowPlaying: []
		});
		const queueMessage = await this.queueChannel.send(messageOptions);

		let entry: QueueEntry;
		try {
			entry = await this.queueStorage.create({
				...newEntry,
				sentAt: new Date(),
				queueMessageId: queueMessage.id,
				isDone: false,
				haveCalledNowPlaying: []
			});

			// If the database write fails...
		} catch (error: unknown) {
			await deleteMessage(queueMessage);
			throw error;
		}

		return entry;
	}

	/** Fetches an entry with the given message ID. */
	async getEntryFromMessage(queueMessageId: string): Promise<QueueEntry | null> {
		return this.queueStorage.fetchEntryFromMessage(queueMessageId);
	}

	/** If the message represents a "done" entry, that entry is unmarked. */
	async markNotDone(queueMessage: Discord.Message | Discord.PartialMessage): Promise<void> {
		await this.queueStorage.markEntryDone(false, queueMessage.id);
		const entry = await this.getEntryFromMessage(queueMessage.id);
		if (!entry) return;

		const editOptions = queueMessageFromEntry(entry);
		await editMessage(queueMessage, editOptions);
	}

	/** If the message represents a "not done" entry, that entry is marked "done". */
	async markDone(queueMessage: Discord.Message | Discord.PartialMessage): Promise<void> {
		await this.queueStorage.markEntryDone(true, queueMessage.id);
		const entry = await this.getEntryFromMessage(queueMessage.id);
		if (!entry) return;

		const editOptions = queueMessageFromEntry(entry);
		await editMessage(queueMessage, editOptions);
	}

	/** Add the given user to the haveCalledNowPlaying field of the queue entry if they aren't already on it. */
	async addUserToHaveCalledNowPlaying(
		user: Discord.Snowflake,
		queueMessage: Discord.Message | Discord.PartialMessage
	): Promise<void> {
		const message = await queueMessage.fetch();

		await this.queueStorage.addToHaveCalledNowPlaying(user, queueMessage.id);

		const entry = await this.getEntryFromMessage(queueMessage.id);
		if (!entry) return;

		await editMessage(message, queueMessageFromEntry(entry));
	}

	/**
	 * If the message represents a queue entry, that entry is removed and the message deleted.
	 *
	 * @returns the entry that was deleted.
	 */
	async deleteEntryFromMessage(
		queueMessage: Discord.Message | Discord.PartialMessage
	): Promise<QueueEntry | null> {
		const entry = await this.queueStorage.fetchEntryFromMessage(queueMessage.id);
		if (entry === null) return entry;

		// FIXME: I think both Message and PartialMessage would return a Snowflake ID. IDK
		await this.queueStorage.removeEntryFromMessage(queueMessage.id);
		await deleteMessage(queueMessage);

		return entry;
	}

	/** Returns all entries in the queue. */
	async getAllEntries(): Promise<Array<QueueEntry>> {
		return this.queueStorage.fetchAll();
	}

	/** Returns the latest entry from the user with the provided ID. */
	async getLatestEntryFrom(userId: string): Promise<QueueEntry | null> {
		return this.queueStorage.fetchLatestFrom(userId);
	}

	/** Returns the average entry duration of the submissions of the user with the provided ID. */
	async getAveragePlaytimeFrom(userId: string): Promise<number> {
		const entries = await this.queueStorage.fetchAllFrom(userId);
		let average = 0;

		entries.forEach(entry => {
			average += entry.seconds;
		});
		average /= entries.length;

		return average;
	}

	/** Resets the queue. Deletes all cached data about the queue. */
	async clear(): Promise<void> {
		return this.queueStorage.clear();
	}
}

/**
 * Sets up and returns an interface for the queue cache and long-term storage.
 *
 * @param queueChannel The channel for the current queue.
 * @returns If we don't have a queue cache stored for the given channel, a new
 *  one is created. We return that. Otherwise, we just return what we have stored
 *  or cached, whichever is handy.
 */
export function useQueue(queueChannel: Discord.TextChannel): QueueManager {
	const queueStorage = useQueueStorage(queueChannel);
	return new QueueManager(queueStorage, queueChannel);
}
