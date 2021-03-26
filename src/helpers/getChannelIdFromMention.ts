import { useLogger } from "../logger";

const LOGGING = false;
const logger = useLogger();

function debugLog(msg: string): void {
  if (LOGGING) logger.debug(msg);
}

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
    debugLog(`This is for sure a mention. Channel ID: ${m}`);

    return m;
  }

  debugLog(`This word does ${startsRight ? "" : "not "}start right.`);
  debugLog(`This word does ${endsRight ? "" : "not "}end right.`);
  return null;
}
