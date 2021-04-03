import Discord, { Message } from "discord.js";
import richErrorMessage from "../../helpers/richErrorMessage";
import { useGuildStorage } from "../../useGuildStorage";
import { useLogger } from "../../logger";

const logger = useLogger();

function isMessage(
  toBeDetermined: Discord.Message | Discord.Guild
): toBeDetermined is Discord.Message {
  return "guild" in toBeDetermined;
}

async function getQueueChannelFromMessage(
  message: Discord.Message
): Promise<Discord.TextChannel | null> {
  if (!message.guild) return null;

  const guildInfo = await useGuildStorage(message.guild);

  const queueChannelId = await guildInfo.getQueueChannelId();
  if (queueChannelId === null || queueChannelId === "") {
    return null;
  }

  let queueChannel: Discord.TextChannel;
  try {
    queueChannel = (await message.client.channels.fetch(queueChannelId)) as Discord.TextChannel;
  } catch (error: unknown) {
    logger.error(richErrorMessage("Failed to fetch queue channel.", error));
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

async function getQueueChannelFromGuild(guild: Discord.Guild): Promise<Discord.TextChannel | null> {
  const guildInfo = await useGuildStorage(guild);

  const queueChannelId = await guildInfo.getQueueChannelId();
  if (queueChannelId === null || queueChannelId === "") {
    return null;
  }

  let queueChannel: Discord.TextChannel;
  try {
    queueChannel = (await guild.client.channels.fetch(queueChannelId)) as Discord.TextChannel;
  } catch (error: unknown) {
    logger.error(richErrorMessage("Failed to fetch queue channel.", error));
    return null;
  }

  if (!queueChannel.isText()) {
    logger.error("The configured channel is not a text channel.");
    return null;
  }

  return queueChannel;
}

/**
 * Retrieves the configured queue channel. Returns `null` if none has been set up yet.
 *
 * This action may send error messages to the message's channel.
 *
 * @param message The message from which to derive a guild's queue channel.
 * @returns the guild's queue channel, or `null` if it has none.
 */
export default async function getQueueChannel(
  message: Discord.Message
): Promise<Discord.TextChannel | null>;

/**
 * Retrieves the configured queue channel. Returns `null` if none has been set up yet.
 *
 * @param guild The guild from which to derive the queue channel.
 * @returns the guild's queue channel, or `null` if it has none.
 */
export default async function getQueueChannel(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  guild: Discord.Guild
): Promise<Discord.TextChannel | null>;

export default async function getQueueChannel(
  source: Discord.Message | Discord.Guild
): Promise<Discord.TextChannel | null> {
  if (isMessage(source)) {
    return getQueueChannelFromMessage(source);
  }
  return getQueueChannelFromGuild(source);
}
