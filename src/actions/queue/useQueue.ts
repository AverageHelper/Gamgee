import type Discord from "discord.js";
import type { MessageButton } from "../../buttons.js";
import type { QueueEntry, UnsentQueueEntry } from "../../useQueueStorage.js";
import { actionRow, DELETE_BUTTON, DONE_BUTTON, RESTORE_BUTTON } from "../../buttons.js";
import { addStrikethrough } from "./strikethroughText.js";
import { composed, createPartialString, push, pushBold } from "../../helpers/composeStrings.js";
import { deleteMessage, editMessage, escapeUriInString } from "../messages/index.js";
import durationString from "../../helpers/durationString.js";
import {
	addToHaveCalledNowPlaying,
	clearEntries,
	createEntry,
	fetchAllEntries,
	fetchAllEntriesFrom,
	fetchEntryFromMessage,
	removeEntryFromMessage,
	markEntryDone
} from "../../useQueueStorage.js";

function queueMessageFromEntry(
	entry: Pick<QueueEntry, "isDone" | "senderId" | "seconds" | "url" | "haveCalledNowPlaying">
): Discord.MessageOptions {
	const partialContent = createPartialString();
	push(`<@!${entry.senderId}>`, partialContent);
	push(" requested a song that's ", partialContent);
	pushBold(durationString(entry.seconds), partialContent);
	push(" long: ", partialContent);

	// Suppress embeds if the entry is marked "Done"
	if (entry.isDone) {
		push(escapeUriInString(entry.url), partialContent);
	} else {
		push(entry.url, partialContent);
	}

	// Bold engangement counter if it's nonzero
	const likeCount = entry.haveCalledNowPlaying.length;
	const likeMessage = `\n${likeCount} ${
		likeCount === 1 ? "person" : "people"
	} asked for this link.`;
	if (likeCount === 0) {
		push(likeMessage, partialContent);
	} else {
		pushBold(likeMessage, partialContent);
	}

	// Strike the message through if the entry is marked "Done"
	const result = composed(partialContent);
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

// TODO: Rewrite this functionally

/**
 * A proxy for queue management and feedback. These methods may modify the
 * queue and manage messages in the queue channel.
 */
export class QueueManager {
	private readonly queueChannel: Discord.TextChannel;

	constructor(queueChannel: Discord.TextChannel) {
		this.queueChannel = queueChannel;
	}

	/** Retrieves the playtime of the queue's unfinished entries. */
	async playtimeRemaining(): Promise<number> {
		const queue = await fetchAllEntries(this.queueChannel);
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
		const queue = await fetchAllEntries(this.queueChannel);
		let duration = 0;
		queue.forEach(e => {
			duration += e.seconds;
		});
		return duration;
	}

	/** Retrieves the average playtime of the queue's entries. */
	async playtimeAverage(): Promise<number> {
		const queue = await fetchAllEntries(this.queueChannel);
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
			entry = await createEntry(
				{
					...newEntry,
					sentAt: new Date(),
					queueMessageId: queueMessage.id,
					isDone: false,
					haveCalledNowPlaying: []
				},
				this.queueChannel
			);

			// If the database write fails...
		} catch (error: unknown) {
			await deleteMessage(queueMessage);
			throw error;
		}

		return entry;
	}

	/** If the message represents a "done" entry, that entry is unmarked. */
	async markNotDone(queueMessage: Discord.Message | Discord.PartialMessage): Promise<void> {
		await markEntryDone(false, queueMessage.id, this.queueChannel);
		const entry = await fetchEntryFromMessage(queueMessage.id, this.queueChannel);
		if (!entry) return;

		const editOptions = queueMessageFromEntry(entry);
		await editMessage(queueMessage, editOptions);
	}

	/** If the message represents a "not done" entry, that entry is marked "done". */
	async markDone(queueMessage: Discord.Message | Discord.PartialMessage): Promise<void> {
		await markEntryDone(true, queueMessage.id, this.queueChannel);
		const entry = await fetchEntryFromMessage(queueMessage.id, this.queueChannel);
		if (!entry) return;

		const editOptions = queueMessageFromEntry(entry);
		await editMessage(queueMessage, editOptions);
	}

	/** Add the given user to the haveCalledNowPlaying field of the queue entry if they aren't already on it. */
	async addUserToHaveCalledNowPlaying(
		user: Discord.Snowflake,
		queueMessage: Discord.Message | Discord.PartialMessage
	): Promise<void> {
		await addToHaveCalledNowPlaying(user, queueMessage.id, this.queueChannel);

		const entry = await fetchEntryFromMessage(queueMessage.id, this.queueChannel);
		if (!entry) return;

		await editMessage(queueMessage, queueMessageFromEntry(entry));
	}

	/**
	 * If the message represents a queue entry, that entry is removed and the message deleted.
	 *
	 * @returns the entry that was deleted.
	 */
	async deleteEntryFromMessage(
		queueMessage: Discord.Message | Discord.PartialMessage
	): Promise<QueueEntry | null> {
		const entry = await fetchEntryFromMessage(queueMessage.id, this.queueChannel);
		if (entry === null) return entry;

		// TODO: Check the docs that both Message and PartialMessage would contain an ID
		await removeEntryFromMessage(queueMessage.id, this.queueChannel);
		await deleteMessage(queueMessage);

		return entry;
	}

	/** Returns the average entry duration of the submissions of the user with the provided ID. */
	async getAveragePlaytimeFrom(userId: string): Promise<number> {
		const entries = await fetchAllEntriesFrom(userId, this.queueChannel);
		let average = 0;

		entries.forEach(entry => {
			average += entry.seconds;
		});
		average /= entries.length;

		return average;
	}

	/** Resets the queue. Deletes all cached data about the queue. */
	async clear(): Promise<void> {
		return clearEntries(this.queueChannel);
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
	return new QueueManager(queueChannel);
}
