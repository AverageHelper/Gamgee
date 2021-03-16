import type Discord from "discord.js";
import { useLogger } from "../logger";

const logger = useLogger();

/**
 * Get a user ID from a mention string.
 *
 * @see https://discordjs.guide/miscellaneous/parsing-mention-arguments.html#implementation
 * @param client The Discord client.
 * @param mention The mention string, in the form `<@!?[0-9]>`.
 * @returns A Discord user, or `undefined` if the user cannot be determined from the providedd `mention` string.
 */
export default async function getUserFromMention(
  message: Discord.Message,
  mention: string
): Promise<Discord.User | undefined> {
  let m = mention.slice();
  if (!m) return undefined;

  const startsRight = m.startsWith("<@");
  const endsRight = m.endsWith(">");

  if (m.startsWith("<@") && m.endsWith(">")) {
    logger.debug("This is for sure a mention. Checking for the nickname flag...");
    m = m.slice(2, -1);

    if (m.startsWith("!")) {
      logger.debug("Stripped nickname.");
      m = m.slice(1);
    }

    logger.debug("userId:", m);
    const user = (await message.guild?.members.fetch(m))?.user;

    if (user) {
      logger.debug("Found user", user.username);
    } else {
      logger.debug("Did not find user.");
    }

    return user;
  }

  logger.debug(`This word does ${startsRight ? "" : "not "}start right.`);
  logger.debug(`This word does ${endsRight ? "" : "not "}end right.`);
  return undefined;
}
