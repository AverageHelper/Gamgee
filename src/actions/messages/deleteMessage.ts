import type Discord from "discord.js";
import isError from "../../helpers/isError";
import richErrorMessage from "../../helpers/richErrorMessage";
import { useLogger } from "../../logger";

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
	if (message.channel.type === "dm") {
		logger.debug("Can't delete others' messages in a DM channel.");
		return false;
	}
	try {
		await message.delete();
		return true;
	} catch (error: unknown) {
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
	messageId: string,
	channel: Discord.TextChannel
): Promise<boolean> {
	try {
		await channel.messages.delete(messageId);
		return true;
	} catch (error: unknown) {
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
	messageIds: Array<string>,
	channel: Discord.TextChannel
): Promise<boolean> {
	try {
		await channel.bulkDelete(messageIds);
		return true;
	} catch (error: unknown) {
		if (isError(error) && error.code === "50034") {
			// Error 50034: You can only bulk delete messages that are under 14 days old.
			logger.info(error.message);
			await Promise.allSettled(messageIds.map(id => deleteMessageWithId(id, channel)));
			return true;
		}

		logger.error(richErrorMessage(`Failed to delete ${messageIds.length} messages.`, error));
		return false;
	}
}
