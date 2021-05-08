import type Discord from "discord.js";
import richErrorMessage from "../../helpers/richErrorMessage";
import { useLogger } from "../../logger";

const logger = useLogger();

/**
 * Attempts to edit the given Discord message. If Discord throws an
 * error at the edit attempt, then the error will be logged and the
 * function's resulting `Promise` will resolve to `false`.
 *
 * @param message The message to delete.
 * @param newContent The new content for the message.
 *
 * @returns a `Promise` that resolves to `true` if the message was edited successfully.
 */
export async function editMessage(
  message: Discord.Message | Discord.PartialMessage,
  newContent:
    | Discord.APIMessageContentResolvable
    | Discord.MessageEditOptions
    | Discord.MessageEmbed
    | Discord.APIMessage
): Promise<boolean> {
  try {
    await message.edit(newContent);
    return true;
  } catch (error: unknown) {
    logger.error(richErrorMessage("Failed to edit a message.", error));
    return false;
  }
}
