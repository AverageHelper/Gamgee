import type Discord from "discord.js";
import type { Snowflake } from "discord.js";
import { isDiscordError } from "../../helpers/isError.js";
import { richErrorMessage } from "../../helpers/richErrorMessage.js";
import { useLogger } from "../../logger.js";
import chunk from "lodash/chunk.js";

const logger = useLogger();

/**
 * Attempts to delete the given Discord message. If Discord throws an
 * error at the delete attempt, then the error will be logged and the
 * function's resulting `Promise` will resolve to `false`.
 *
 * @param message The message to delete.
 *
 * @returns a `Promise` that resolves to `true` if the message was deleted successfully.
 */
export async function deleteMessage(
	message: Discord.Message | Discord.PartialMessage
): Promise<boolean> {
	if (message.channel.type === "DM") {
		logger.debug("Can't delete others' messages in a DM channel.");
		return false;
	}
	try {
		await message.delete();
		return true;
	} catch (error) {
		logger.error(richErrorMessage("Failed to delete a message.", error));
		return false;
	}
}

/**
 * Attempts to delete the given Discord message. If Discord throws an
 * error at the delete attempt, then the error will be logged and the
 * function's resulting `Promise` will resolve to `false`.
 *
 * @param messageId The ID of the message to delete.
 * @param channel The channel in which to search for the message to delete.
 *
 * @returns a `Promise` that resolves to `true` if the message was deleted successfully.
 */
export async function deleteMessageWithId(
	messageId: Snowflake,
	channel: Discord.TextChannel
): Promise<boolean> {
	try {
		await channel.messages.delete(messageId);
		return true;
	} catch (error) {
		logger.error(richErrorMessage("Failed to delete a message.", error));
		return false;
	}
}

/**
 * Attempts to delete the given Discord messages. If Discord throws an
 * error at the delete attempt, then the error will be logged and the
 * function's resulting `Promise` will resolve to `false`.
 *
 * @param messageIds The IDs of the messages to delete.
 * @param channel The channel in which to search for the messages to delete.
 *
 * @returns A `Promise` that resolves to `true` if the messages were deleted successfully.
 */
export async function bulkDeleteMessagesWithIds(
	messageIds: Array<Snowflake>,
	channel: Discord.TextChannel
): Promise<boolean> {
	if (messageIds.length === 0) return true;

	try {
		// Batch up to 100 IDs at a time
		for (const ids of chunk(messageIds, 100)) {
			if (ids.length === 1) {
				// Given one ID, just delete individually
				const messageId = ids[0] as string;
				await channel.messages.delete(messageId);
			} else {
				await channel.bulkDelete(ids);
			}
		}

		return true;
	} catch (error) {
		if (isDiscordError(error) && error.code === 50034) {
			// Error 50034: You can only bulk delete messages that are under 14 days old.
			logger.warn(error.message);
			await Promise.allSettled(messageIds.map(id => deleteMessageWithId(id, channel))); // TODO: Handle these errors
			return true;
		}

		logger.error(richErrorMessage(`Failed to delete ${messageIds.length} messages.`, error));
		return false;
	}
}
