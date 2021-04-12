import type Discord from "discord.js";
import richErrorMessage from "../../helpers/richErrorMessage";
import { getEnv } from "../../helpers/environment";
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
    const user = message.author;
    if (user.bot && user.id === getEnv("CORDE_BOT_ID")) {
      await message.channel.send(`(DM to <@!${user.id}>)\n${content}`);
    } else if (!user.bot) {
      await user.send(`(Reply from <#${message.channel.id}>)\n${content}`);
    }
    // Normal bot messages get ignored
    return true;
  } catch (error: unknown) {
    logger.error(richErrorMessage("Failed to send direct message.", error));
    return false;
  }
}

/**
 * Sends a message in the same channel as the provided `message` with a
 * mention to the sender.
 *
 * @param message The message to which to reply.
 * @param content The content of the message to send.
 *
 * @returns a `Promise` that resolves if the send succeeds.
 */
export async function replyWithMention(message: Discord.Message, content: string): Promise<void> {
  try {
    await message.reply(content);
  } catch (error: unknown) {
    logger.error(richErrorMessage("Failed to send message.", error));
  }
}
