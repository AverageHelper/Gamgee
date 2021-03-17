import type Discord from "discord.js";
import type { CommandContext } from "../commands/index";
import { getConfigQueueChannel } from "../actions/config/getConfigValue";
import { useLogger } from "../logger";

const logger = useLogger();

/**
 * Retrieves the configured queue channel. Returns `null` if none has been set up yet.
 *
 * This action may sent error messages to the channel using the provided `context`.
 *
 * @param context The context of the command that needs the queue channel.
 * @returns
 */
export default async function getQueueChannel(
  context: CommandContext
): Promise<Discord.TextChannel | null> {
  const { message, client, storage } = context;

  const queueChannelId = await getConfigQueueChannel(storage);
  if (!queueChannelId) {
    return null;
  }

  let queueChannel: Discord.TextChannel;
  try {
    queueChannel = (await client.channels.fetch(queueChannelId)) as Discord.TextChannel;
  } catch (error) {
    logger.error("Failed to fetch queue channel:", error);
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
