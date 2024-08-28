import type {
	Message,
	MessageCreateOptions,
	MessageEditOptions,
	PartialMessage,
	Snowflake,
	TextChannel,
} from "discord.js";
import type { MessageButton } from "../../buttons.js";
import type { QueueEntry, UnsentQueueEntry } from "../../useQueueStorage.js";
import type { SupportedLocale } from "../../i18n.js";
import { actionRow, DELETE_BUTTON, DONE_BUTTON, RESTORE_BUTTON } from "../../buttons.js";
import { addStrikethrough } from "./strikethroughText.js";
import { deleteMessage, editMessage, escapeUriInString } from "../messages/index.js";
import { durationString } from "../../helpers/durationString.js";
import { preferredLocale } from "../../i18n.js";
import {
	addToHaveCalledNowPlayingForStoredEntry,
	deleteStoredEntry,
	getAllStoredEntries,
	getAllStoredEntriesFromSender,
	getStoredEntry,
	saveNewEntryToDatabase,
	updateStoredEntryIsDone,
} from "../../useQueueStorage.js";
import {
	composed,
	createPartialString,
	push,
	pushBold,
	pushNewLine,
} from "../../helpers/composeStrings.js";

// FIXME: Some of these may be inlined with functions from useQueueStorage.js, and should be inlined to avoid confusion between raw database function and full queue functions

// TODO: i18n

/**
 * Generates a Discord message that describes the entry. Good for inserting into the guild's queue channel.
 */
function queueMessageFromEntry(
	locale: SupportedLocale,
	entry: Pick<QueueEntry, "isDone" | "senderId" | "seconds" | "url" | "haveCalledNowPlaying">,
): MessageCreateOptions & MessageEditOptions {
	const partialContent = createPartialString();
	push(`<@!${entry.senderId}>`, partialContent);
	push(" requested a song that's ", partialContent);
	pushBold(durationString(locale, entry.seconds), partialContent);
	push(" long: ", partialContent);

	// Suppress embeds if the entry is marked "Done"
	if (entry.isDone) {
		push(escapeUriInString(entry.url), partialContent);
	} else {
		push(entry.url, partialContent);
	}

	// Bold engangement counter if it's nonzero
	const likeCount = entry.haveCalledNowPlaying.length;
	const likeMessage = `${likeCount} ${
		likeCount === 1 ? "person" : "people"
	} asked me for this link.`;
	if (likeCount > 0) {
		pushNewLine(partialContent);
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
		components: [actionRow(entryButtons)],
	};
}

/** Retrieves the playtime (in seconds) of the queue's unfinished entries. */
export async function playtimeRemainingInQueue(queueChannel: TextChannel): Promise<number> {
	const queue = await getAllStoredEntries(queueChannel);
	let duration = 0;
	for (const e of queue.filter(e => !e.isDone)) {
		duration += e.seconds;
	}
	return duration;
}

/** Retrieves the total playtime (in seconds) of the queue's entries. */
export async function playtimeTotalInQueue(queueChannel: TextChannel): Promise<number> {
	const queue = await getAllStoredEntries(queueChannel);
	let duration = 0;
	for (const e of queue) {
		duration += e.seconds;
	}
	return duration;
}

/** Retrieves the average playtime (in seconds) of the queue's entries. */
export async function playtimeAverageInQueue(queueChannel: TextChannel): Promise<number> {
	const queue = await getAllStoredEntries(queueChannel);
	let average = 0;
	for (const e of queue) {
		average += e.seconds;
	}
	average /= queue.length;
	return average;
}

/** Adds an entry to the queue cache and sends the entry to the queue channel. */
export async function pushEntryToQueue(
	newEntry: UnsentQueueEntry,
	queueChannel: TextChannel,
): Promise<QueueEntry> {
	const messageOptions = queueMessageFromEntry(preferredLocale(queueChannel.guild), {
		...newEntry,
		isDone: false,
		haveCalledNowPlaying: [],
	});
	const queueMessage = await queueChannel.send(messageOptions);

	let entry: QueueEntry;
	try {
		entry = await saveNewEntryToDatabase(
			{
				url: newEntry.url,
				seconds: newEntry.seconds,
				senderId: newEntry.senderId,
				sentAt: new Date(), // this call should be linearized with other such calls, so that we never have a duplicate date. Useful to keep ordering consistent between queue channel and db.
				queueMessageId: queueMessage.id,
				isDone: false,
			},
			queueChannel,
		);

		// If the database write fails...
	} catch (error) {
		await deleteMessage(queueMessage);
		throw error;
	}

	return entry;
}

/** Returns the average entry duration of the submissions of the user with the provided ID. */
export async function averageSubmissionPlaytimeForUser(
	userId: Snowflake,
	queueChannel: TextChannel,
): Promise<number> {
	const entries = await getAllStoredEntriesFromSender(userId, queueChannel);
	let average = 0;

	for (const entry of entries) {
		average += entry.seconds;
	}
	average /= entries.length;

	return average;
}

/** If the message represents a "done" entry, that entry is unmarked. */
export async function markEntryNotDoneInQueue(
	queueMessage: Message | PartialMessage,
	queueChannel: TextChannel,
): Promise<void> {
	await updateStoredEntryIsDone(false, queueMessage.id);
	const entry = await getStoredEntry(queueMessage.id);
	if (!entry) return;

	const editOptions = queueMessageFromEntry(preferredLocale(queueChannel.guild), entry);
	await editMessage(queueMessage, editOptions);
}

/** If the message represents a "not done" entry, that entry is marked "done". */
export async function markEntryDoneInQueue(
	queueMessage: Message | PartialMessage,
	queueChannel: TextChannel,
): Promise<void> {
	await updateStoredEntryIsDone(true, queueMessage.id);
	const entry = await getStoredEntry(queueMessage.id);
	if (!entry) return;

	const editOptions = queueMessageFromEntry(preferredLocale(queueChannel.guild), entry);
	await editMessage(queueMessage, editOptions);
}

/** Add the given user to the haveCalledNowPlaying field of the queue entry if they aren't already on it. */
export async function addUserToHaveCalledNowPlaying(
	user: Snowflake,
	queueMessage: Message | PartialMessage,
	queueChannel: TextChannel,
): Promise<void> {
	await addToHaveCalledNowPlayingForStoredEntry(user, queueMessage.id, queueChannel);

	const entry = await getStoredEntry(queueMessage.id);
	if (!entry) return;

	await editMessage(
		queueMessage,
		queueMessageFromEntry(preferredLocale(queueChannel.guild), entry),
	);
}

/**
 * If the message represents a queue entry, that entry is removed and the message deleted.
 *
 * @returns the entry that was deleted.
 */
export async function deleteEntryFromMessage(
	queueMessage: Message | PartialMessage,
): Promise<QueueEntry | null> {
	const entry = await getStoredEntry(queueMessage.id);
	if (entry === null) return entry;

	await deleteStoredEntry(queueMessage.id);
	await deleteMessage(queueMessage);

	return entry;
}
