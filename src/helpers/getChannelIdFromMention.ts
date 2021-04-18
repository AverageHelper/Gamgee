import type { Logger } from "../logger";

/**
 * Get a channel ID from a mention string.
 *
 * @param mention The mention string, in the form `<#[0-9]>`.
 * @param logger The logger to which to send debug messages.
 *
 * @returns The ID string between the mention markers.
 */
export default function getChannelIdFromMention(mention: string, logger: Logger): string | null {
  let id = mention.slice();
  if (!id) return null;

  const startsRight = id.startsWith("<#");
  const endsRight = id.endsWith(">");

  if (startsRight && endsRight) {
    id = id.slice(2, -1);

    logger.debug(`Channel ${id} was mentioned.`);
    return id;
  }

  logger.debug("No channel was mentioned.");
  return null;
}
