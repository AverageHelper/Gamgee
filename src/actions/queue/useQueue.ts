import type Discord from "discord.js";
import type { MessageButton } from "../../buttons.js";
import type { QueueEntry, UnsentQueueEntry } from "../../useQueueStorage.js";
import { actionRow, DELETE_BUTTON, DONE_BUTTON, RESTORE_BUTTON } from "../../buttons.js";
import { addStrikethrough } from "./strikethroughText.js";
import { deleteMessage, editMessage, escapeUriInString } from "../messages/index.js";
import { durationString } from "../../helpers/durationString.js";
import {
	addToHaveCalledNowPlaying,
	createEntry,
	fetchAllEntries,
	fetchEntryFromMessage,
	removeEntryFromMessage,
	markEntryDone
} from "../../useQueueStorage.js";
import {
	composed,
	createPartialString,
	push,
	pushBold,
	pushNewLine
} from "../../helpers/composeStrings.js";

// FIXME: Some of these may be inlined with functions from useQueueStorage.js, and should be inlined to avoid confusion between raw database function and full queue functions

/**
 * Generates a Discord message that describes the entry. Good for inserting into the guild's queue channel.
 */
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
	pushNewLine(partialContent);

	// Bold engangement counter if it's nonzero
	const likeCount = entry.haveCalledNowPlaying.length;
	const likeMessage = `${likeCount} ${likeCount === 1 ? "person" : "people"} asked for this link.`;
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

/** Retrieves the playtime of the queue's unfinished entries. */
export async function playtimeRemainingInQueue(queueChannel: Discord.TextChannel): Promise<number> {
	const queue = await fetchAllEntries(queueChannel);
	let duration = 0;
	queue
		.filter(e => !e.isDone)
		.forEach(e => {
			duration += e.seconds;
		});
	return duration;
}

/** Retrieves the total playtime of the queue's entries. */
export async function playtimeTotalInQueue(queueChannel: Discord.TextChannel): Promise<number> {
	const queue = await fetchAllEntries(queueChannel);
	let duration = 0;
	queue.forEach(e => {
		duration += e.seconds;
	});
	return duration;
}

/** Retrieves the average playtime of the queue's entries. */
export async function playtimeAverageInQueue(queueChannel: Discord.TextChannel): Promise<number> {
	const queue = await fetchAllEntries(queueChannel);
	let average = 0;
	queue.forEach(e => {
		average += e.seconds;
	});
	average /= queue.length;
	return average;
}

/** Adds an entry to the queue cache and sends the entry to the queue channel. */
export async function pushEntryToQueue(
	newEntry: UnsentQueueEntry,
	queueChannel: Discord.TextChannel
): Promise<QueueEntry> {
	const messageOptions = queueMessageFromEntry({
		...newEntry,
		isDone: false,
		haveCalledNowPlaying: []
	});
	const queueMessage = await queueChannel.send(messageOptions);

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
			queueChannel
		);

		// If the database write fails...
	} catch (error) {
		await deleteMessage(queueMessage);
		throw error;
	}

	return entry;
}

/** If the message represents a "done" entry, that entry is unmarked. */
export async function markEntryNotDoneInQueue(
	queueMessage: Discord.Message | Discord.PartialMessage,
	queueChannel: Discord.TextChannel
): Promise<void> {
	await markEntryDone(false, queueMessage.id, queueChannel);
	const entry = await fetchEntryFromMessage(queueMessage.id, queueChannel);
	if (!entry) return;

	const editOptions = queueMessageFromEntry(entry);
	await editMessage(queueMessage, editOptions);
}

/** If the message represents a "not done" entry, that entry is marked "done". */
export async function markEntryDoneInQueue(
	queueMessage: Discord.Message | Discord.PartialMessage,
	queueChannel: Discord.TextChannel
): Promise<void> {
	await markEntryDone(true, queueMessage.id, queueChannel);
	const entry = await fetchEntryFromMessage(queueMessage.id, queueChannel);
	if (!entry) return;

	const editOptions = queueMessageFromEntry(entry);
	await editMessage(queueMessage, editOptions);
}

/** Add the given user to the haveCalledNowPlaying field of the queue entry if they aren't already on it. */
export async function addUserToHaveCalledNowPlaying(
	user: Discord.Snowflake,
	queueMessage: Discord.Message | Discord.PartialMessage,
	queueChannel: Discord.TextChannel
): Promise<void> {
	await addToHaveCalledNowPlaying(user, queueMessage.id, queueChannel);

	const entry = await fetchEntryFromMessage(queueMessage.id, queueChannel);
	if (!entry) return;

	await editMessage(queueMessage, queueMessageFromEntry(entry));
}

/**
 * If the message represents a queue entry, that entry is removed and the message deleted.
 *
 * @returns the entry that was deleted.
 */
export async function deleteEntryFromMessage(
	queueMessage: Discord.Message | Discord.PartialMessage,
	queueChannel: Discord.TextChannel
): Promise<QueueEntry | null> {
	const entry = await fetchEntryFromMessage(queueMessage.id, queueChannel);
	if (entry === null) return entry;

	// TODO: Check the docs that both Message and PartialMessage would contain an ID
	await removeEntryFromMessage(queueMessage.id, queueChannel);
	await deleteMessage(queueMessage);

	return entry;
}
