import { useLogger } from "../logger";

const logger = useLogger();

/**
 * Get a user ID from a mention string.
 *
 * @see https://discordjs.guide/miscellaneous/parsing-mention-arguments.html#implementation
 * @param mention The mention string, in the form `<@!?[0-9]>`.
 * @returns The ID string between the mention markers.
 */
export default function getUserIdFromMention(mention: string): string | null {
  let m = mention.slice();
  if (!m) return null;

  const startsRight = m.startsWith("<@");
  const endsRight = m.endsWith(">");

  if (startsRight && endsRight) {
    logger.debug("This is for sure a mention. Checking for the nickname flag...");
    m = m.slice(2, -1);

    if (m.startsWith("!")) {
      logger.debug("Stripped nickname.");
      m = m.slice(1);
    }

    logger.debug(`userId: ${m}`);
    return m;
  }

  logger.debug(`This word does ${startsRight ? "" : "not "}start right.`);
  logger.debug(`This word does ${endsRight ? "" : "not "}end right.`);
  return null;
}
