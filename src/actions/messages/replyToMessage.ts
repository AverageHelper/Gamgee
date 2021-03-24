import type Discord from "discord.js";
import { useLogger } from "../../logger";

const logger = useLogger();

/**
 * Attempts to send a direct message to the author of the given message. If
 * Discord throws an error at the attempt, then the error is logged, and
 * the returned `Promise` resolves to `false`.
 *
 * The current channel name is automatically prepended to the message content.
 *
 * @param message The message to which to reply.
 * @param content The content of the message to send.
 *
 * @returns a `Promise` that resolves with `true` if the send succeeds, or
 * `false` if there was an error.
 */
export async function replyPrivately(message: Discord.Message, content: string): Promise<boolean> {
  try {
    await message.author.send(`(Reply from <#${message.channel.id}>)\n${content}`);
    // TODO: If the message author is our test bot, send in the channel instead
    return true;
  } catch (error: unknown) {
    logger.error(`Failed to send direct message: ${JSON.stringify(error, undefined, 2)}`);
    return false;
  }
}
