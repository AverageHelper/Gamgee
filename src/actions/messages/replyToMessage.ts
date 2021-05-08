import type Discord from "discord.js";
import type { CommandContext } from "../../commands";
import richErrorMessage from "../../helpers/richErrorMessage";
import { getEnv } from "../../helpers/environment";
import { useLogger } from "../../logger";
import logUser from "../../helpers/logUser";
import StringBuilder from "../../helpers/StringBuilder";

const logger = useLogger();

/**
 * Attempts to send a direct message to the given user. If Discord throws
 * an error at the attempt, then the error is logged, and the returned
 * `Promise` resolves to `false`.
 *
 * The current channel name is automatically prepended to the message content.
 *
 * @param user The user to whom to reply.
 * @param content The content of the message to send.
 *
 * @returns a `Promise` that resolves with `true` if the send succeeds, or
 * `false` if there was an error.
 */
export async function sendPrivately(user: Discord.User, content: string): Promise<boolean> {
  try {
    if (user.bot && user.id === getEnv("CORDE_BOT_ID")) {
      logger.error(
        `I'm sure ${user.username} is a nice person, but I should not send DMs to a bot. I don't know how to report this.`
      );
    } else if (!user.bot) {
      await user.send(content);
      logger.verbose(`Sent DM to User ${logUser(user)}: ${content}`);
    }
    // Normal bot messages get ignored
    return true;
  } catch (error: unknown) {
    logger.error(richErrorMessage("Failed to send direct message.", error));
    return false;
  }
}

export async function replyPrivatelyToCommand(
  context: CommandContext,
  content: string
): Promise<boolean> {
  if (context.type === "interaction") {
    return replyPrivately(context.interaction, content);
  }
  return replyPrivately(context.message, content);
}

/**
 * Attempts to send a direct message to the author of the given message. If
 * Discord throws an error at the attempt, then the error is logged, and
 * the returned `Promise` resolves to `false`.
 *
 * The current channel name is automatically prepended to the message content.
 *
 * @param message The message or interaction to which to reply.
 * @param content The content of the message to send.
 *
 * @returns a `Promise` that resolves with `true` if the send succeeds, or
 * `false` if there was an error.
 */
export async function replyPrivately(
  source: Discord.Message | Discord.CommandInteraction,
  content: string
): Promise<boolean> {
  try {
    let user: Discord.User;

    if ("author" in source) {
      user = source.author;
    } else {
      user = source.user;
    }
    if (user.bot && user.id === getEnv("CORDE_BOT_ID")) {
      await source.reply(`(DM to <@!${user.id}>)\n${content}`);
    } else if (!user.bot) {
      const response = new StringBuilder();
      if ("author" in source) {
        response.push(`(Reply from <#${source.channel.id}>)`);
      } else if (source.channel) {
        response.push(`(Reply from <#${source.channel.id}>)`);
      }
      response.pushNewLine();
      await user.send(content);
      logger.verbose(`Sent DM to User ${logUser(user)}: ${content}`);
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

/**
 * Sends a message in the same channel as the provided command, pinging the original sender.
 *
 * @param context The command to which to respond.
 * @param content The content of the message to send.
 *
 * @returns a `Promise` that resolves if the reply succeeds.
 */
export async function replyWithMentionToCommand(
  context: CommandContext,
  content: string
): Promise<void> {
  try {
    if (context.type === "interaction") {
      await context.interaction.reply(content);
    } else {
      await context.message.reply(content);
    }
  } catch (error: unknown) {
    logger.error(richErrorMessage("Failed to send message.", error));
  }
}
