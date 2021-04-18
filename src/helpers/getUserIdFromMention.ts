import type { Logger } from "../logger";

/**
 * Get a user ID from a mention string.
 * @see https://discordjs.guide/miscellaneous/parsing-mention-arguments.html#implementation
 *
 * @param mention The mention string, in the form `<@!?[0-9]>`.
 * @param logger The logger to which to send debug messages.
 *
 * @returns The ID string between the mention markers.
 */
export default function getUserIdFromMention(mention: string, logger: Logger): string | null {
  let id = mention.slice();
  if (!id) return null;

  const startsRight = id.startsWith("<@");
  const endsRight = id.endsWith(">");

  if (startsRight && endsRight) {
    id = id.slice(2, -1);

    if (id.startsWith("!")) {
      id = id.slice(1);
    }

    logger.debug(`User ${id} was mentioned.`);
    return id;
  }

  logger.debug("No user was mentioned.");
  return null;
}
