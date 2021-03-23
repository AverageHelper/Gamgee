import type Discord from "discord.js";
import { useLogger } from "../logger";

const logger = useLogger();

/**
 * Attempts to delete the given Discord message. If the bot does not have permission to delete the message, then an error will be logged and the function's resulting `Promise` will resolve to `false`.
 *
 * @param message The message to delete.
 * @param rason The reason for the deletion, to provide to Discord's API.
 *
 * @returns A `Promise` that resolves to `true` if the message was deleted successfully.
 */
export default async function deleteMessage(
  message: Discord.Message,
  reason: string
): Promise<boolean> {
  try {
    await message.delete({ reason });
    return true;
  } catch (error: unknown) {
    logger.error(
      `I don't seem to have permission to delete messages: ${JSON.stringify(error, undefined, 2)}`
    );
    return false;
  }
}
