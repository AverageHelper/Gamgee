import { useLogger } from "../logger";

const logger = useLogger();

// TODO: Write unit tests for this function

/**
 * Get a channel ID from a mention string.
 *
 * @param mention The mention string, in the form `<#[0-9]>`.
 * @returns The ID string between the mention markers.
 */
export default function getChannelIdFromMention(mention: string): string | null {
  let m = mention.slice();
  if (!m) return null;

  const startsRight = m.startsWith("<#");
  const endsRight = m.endsWith(">");

  if (startsRight && endsRight) {
    m = m.slice(2, -1);
    logger.debug(`This is for sure a mention. Channel ID: ${m}`);

    return m;
  }

  logger.debug(`This word does ${startsRight ? "" : "not "}start right.`);
  logger.debug(`This word does ${endsRight ? "" : "not "}end right.`);
  return null;
}
