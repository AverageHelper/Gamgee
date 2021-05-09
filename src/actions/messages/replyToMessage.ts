import type Discord from "discord.js";
import { DiscordAPIError } from "discord.js";
import { getEnv } from "../../helpers/environment";
import { useLogger } from "../../logger";
import richErrorMessage from "../../helpers/richErrorMessage";
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
export async function sendPrivately(user: Discord.User, content: string): Promise<void> {
  try {
    if (user.bot && user.id === getEnv("CORDE_BOT_ID")) {
      logger.error(
        `I'm sure ${user.username} is a nice person, but I should not send DMs to a bot. I don't know how to report this.`
      );
    } else if (!user.bot) {
      await user.send(content);
      logger.verbose(`Sent DM to User ${logUser(user)}: ${content}`);
    }
  } catch (error: unknown) {
    logger.error(richErrorMessage("Failed to send direct message.", error));
  }
}

async function sendDM(source: Discord.Message, content: string): Promise<void> {
  const user: Discord.User = source.author;
  try {
    if (user.bot && user.id === getEnv("CORDE_BOT_ID")) {
      // this is our known tester
      logger.silly(`Good morning, Miss ${user.username}.`);
      await reply(source, `(DM to <@!${user.id}>)\n${content}`);
    } else if (!user.bot) {
      logger.silly("This is a human. Or their dog... I love dogs!");
      const response = new StringBuilder();
      response.push(`(Reply from <#${source.channel.id}>)`);
      response.pushNewLine();
      response.push(content);
      await user.send(response.result());
      logger.verbose(`Sent DM to User ${logUser(user)}: ${content}`);
    } else {
      logger.error(
        `I'm sure ${user.username} is a nice person, but they are a bot. I should not send DMs to a bot. I don't know how to report this to you, so here's an error!`
      );
    }
  } catch (error: unknown) {
    logger.error(
      richErrorMessage(`Failed to send direct message to user ${logUser(user)}.`, error)
    );
  }
}

async function sendEphemeralReply(
  source: Discord.CommandInteraction,
  content: string
): Promise<void> {
  try {
    await source.reply(content, { ephemeral: true });
  } catch (error: unknown) {
    logger.error(richErrorMessage(`Failed to send ephemeral message.`, error));
  }
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
): Promise<void> {
  if ("author" in source) {
    await sendDM(source, content);
  } else {
    await sendEphemeralReply(source, content);
  }
}

async function sendMessageInChannel(
  channel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel,
  content: string
): Promise<void> {
  try {
    await channel.send(content);
  } catch (error: unknown) {
    logger.error(richErrorMessage(`Failed to send message '${content}'.`, error));
  }
}

/**
 * Sends a message in the same channel as the provided `message` with a
 * mention to the sender.
 *
 * @param message The message to which to reply.
 * @param content The content of the message to send.
 * @param shouldMention Whether the user should be pinged with the reply.
 *
 * @returns a `Promise` that resolves if the send succeeds.
 */
export async function reply(
  message: Discord.Message,
  content: string,
  shouldMention: boolean = false
): Promise<void> {
  try {
    if (shouldMention) {
      await message.reply(content);
    } else {
      await message.reply(content, { allowedMentions: { users: [] } });
    }
  } catch (error: unknown) {
    if (error instanceof DiscordAPIError && error.message.includes("message_reference")) {
      logger.debug(
        `The message ${message.id} must have been deleted. Sending reply in same channel.`
      );
      return sendMessageInChannel(message.channel, content);
    }
    logger.error(richErrorMessage(`Failed to send message '${content}'.`, error));
  }
}
