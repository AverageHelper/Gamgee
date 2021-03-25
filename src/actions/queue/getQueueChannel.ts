import type Discord from "discord.js";
import { useGuildStorage } from "../../useGuildStorage";
import { useLogger } from "../../logger";

const logger = useLogger();

/**
 * Retrieves the configured queue channel. Returns `null` if none has been set up yet.
 *
 * This action may sent error messages to the channel using the provided `context`.
 *
 * @param message The message from which to derive a guild's queue channel.
 * @returns the guild's queue channel, or `null` if it has none.
 */
export default async function getQueueChannel(
  message: Discord.Message
): Promise<Discord.TextChannel | null> {
  if (!message.guild) return null;

  const guildInfo = await useGuildStorage(message.guild);

  const queueChannelId = await guildInfo.getQueueChannelId();
  if (!queueChannelId) {
    return null;
  }

  let queueChannel: Discord.TextChannel;
  try {
    queueChannel = (await message.client.channels.fetch(queueChannelId)) as Discord.TextChannel;
  } catch (error: unknown) {
    logger.error(`Failed to fetch queue channel: ${JSON.stringify(error, undefined, 2)}`);
    await message.channel.send(
      "The configured channel doesn't exist. Have an administrator set the queue back up."
    );
    return null;
  }

  if (!queueChannel.isText()) {
    logger.error("The configured channel is not a text channel.");
    await message.channel.send(
      "The configured channel is not a text channel. Have an administrator set up the queue again."
    );
    return null;
  }

  return queueChannel;
}
