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

/**
 * Attempts to send a direct message to a user.
 *
 * @param user The user to DM.
 * @param content The message to send.
 *
 * @returns `true` if the DM was successful. `false` if there was an error.
 * This will be the case if the target user has DMs disabled.
 */
async function sendDM(user: Discord.User, content: string): Promise<boolean> {
  try {
    await user.send(content);
    return true;
  } catch (error: unknown) {
    logger.error(
      richErrorMessage(`Failed to send direct message to user ${logUser(user)}.`, error)
    );
    return false;
  }
}

function replyMessage(channel: { id: string } | null, content: string): string {
  const msg = new StringBuilder();
  if (channel) {
    msg.push(`(Reply from <#${channel.id}>)`);
    msg.pushNewLine();
  }
  msg.push(content);
  return msg.result();
}

async function sendDMReply(source: Discord.Message, content: string): Promise<boolean> {
  const user: Discord.User = source.author;
  try {
    if (user.bot && user.id === getEnv("CORDE_BOT_ID")) {
      // this is our known tester
      logger.silly(`Good morning, Miss ${user.username}.`);
      await reply(source, `(DM to <@!${user.id}>)\n${content}`);
      return true;
    } else if (!user.bot) {
      logger.silly("This is a human. Or their dog... I love dogs!");
      const response = replyMessage(source.channel, content);
      await user.send(response);
      logger.verbose(`Sent DM to User ${logUser(user)}: ${content}`);
      return true;
    }
    logger.error(
      `I'm sure ${user.username} is a nice person, but they are a bot. I should not send DMs to a bot. I don't know how to report this to you, so here's an error!`
    );
    return false;
  } catch (error: unknown) {
    logger.error(
      richErrorMessage(`Failed to send direct message to user ${logUser(user)}.`, error)
    );
    return false;
  }
}

async function sendEphemeralReply(
  source: Discord.CommandInteraction,
  content: string
): Promise<boolean> {
  try {
    await source.reply(content, { ephemeral: true });
    logger.verbose(`Sent ephemeral reply to User ${logUser(source.user)}: ${content}`);
    return true;
  } catch (error: unknown) {
    logger.error(richErrorMessage(`Failed to send ephemeral message.`, error));
    return false;
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
 * @param preferDMs If `source` is an interaction, then we'll reply via DMs anyway.
 *
 * @returns a `Promise` that resolves with `true` if the send succeeds, or
 * `false` if there was an error.
 */
export async function replyPrivately(
  source: Discord.Message | Discord.CommandInteraction,
  content: string,
  preferDMs: boolean
): Promise<boolean> {
  if ("author" in source) {
    return sendDMReply(source, content);
  }
  if (preferDMs) {
    return sendDM(source.user, replyMessage(source.channel, content));
  }
  return sendEphemeralReply(source, content);
}

/**
 * Attempts to send a message in the provided channel.
 *
 * @param channel The text channel in which to send the message.
 * @param content The message to send.
 */
export async function sendMessageInChannel(
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
  shouldMention: boolean = true
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
