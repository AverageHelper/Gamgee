import { useLogger } from "../logger";

const LOGGING = false;
const logger = useLogger();

function debugLog(msg: string): void {
  if (LOGGING) logger.debug(msg);
}

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
    debugLog("This is for sure a mention. Checking for the nickname flag...");
    m = m.slice(2, -1);

    if (m.startsWith("!")) {
      debugLog("Stripped nickname.");
      m = m.slice(1);
    }

    debugLog(`userId: ${m}`);
    return m;
  }

  debugLog(`This word does ${startsRight ? "" : "not "}start right.`);
  debugLog(`This word does ${endsRight ? "" : "not "}end right.`);
  return null;
}
