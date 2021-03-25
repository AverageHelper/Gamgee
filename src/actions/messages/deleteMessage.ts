import type Discord from "discord.js";
import { useLogger } from "../../logger";

const logger = useLogger();

/**
 * Attempts to delete the given Discord message. If Discord throws an
 * error at the delete attempt, then the error will be logged and the
 * function's resulting `Promise` will resolve to `false`.
 *
 * @param message The message to delete.
 * @param reason The reason for the deletion, to provide to Discord's API.
 *
 * @returns A `Promise` that resolves to `true` if the message was deleted successfully.
 */
export async function deleteMessage(message: Discord.Message, reason?: string): Promise<boolean> {
  if (message.channel.type === "dm") {
    logger.debug("Can't delete others' messages in a DM channel.");
    return false;
  }
  try {
    await message.delete({ reason });
    return true;
  } catch (error: unknown) {
    logger.error(`Failed to delete a message: ${JSON.stringify(error, undefined, 2)}`);
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
 * @param reason The reason for the deletion, to provide to Discord's API.
 *
 * @returns A `Promise` that resolves to `true` if the message was deleted successfully.
 */
export async function deleteMessageWithId(
  messageId: string,
  channel: Discord.TextChannel,
  reason?: string
): Promise<boolean> {
  try {
    await channel.messages.delete(messageId, reason);
    return true;
  } catch (error: unknown) {
    logger.error(`Failed to delete a message: ${JSON.stringify(error, undefined, 2)}`);
    return false;
  }
}
