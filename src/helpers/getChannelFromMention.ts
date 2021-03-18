import type Discord from "discord.js";
import { useLogger } from "../logger";

const logger = useLogger();

/**
 * Get a channel ID from a mention string.
 *
 * @param client The Discord client.
 * @param mention The mention string, in the form `<#[0-9]>`.
 * @returns A Discord channel, or `undefined` if the user cannot be determined from the providedd `mention` string.
 */
export default function getChannelFromMention(
  message: Discord.Message,
  mention: string
): Discord.GuildChannel | undefined {
  let m = mention.slice();
  if (!m) return undefined;

  const startsRight = m.startsWith("<#");
  const endsRight = m.endsWith(">");

  if (startsRight && endsRight) {
    m = m.slice(2, -1);
    logger.debug(`This is for sure a mention. userId: ${m}`);

    const channel = message.guild?.channels.resolve(m) ?? undefined;

    if (channel) {
      logger.debug(`Found channel ${channel.name}`);
    } else {
      logger.debug("Did not find user.");
    }

    return channel;
  }

  logger.debug(`This word does ${startsRight ? "" : "not "}start right.`);
  logger.debug(`This word does ${endsRight ? "" : "not "}end right.`);
  return undefined;
}
