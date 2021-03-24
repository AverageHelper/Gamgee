import type Discord from "discord.js";
import { useLogger } from "../../logger";

const logger = useLogger();

/**
 * Attempts to send a direct message to the given user. If Discord throws an
 * error at the attempt, then the error is logged, and the returned `Promise`
 * resolves to `false`.
 *
 * @param user The user to DM.
 * @param content The content of the message to send.
 *
 * @returns a `Promise` that resolves with `true` if the send succeeds, or
 * `false` if there was an error.
 */
export async function sendDMToUser(user: Discord.User, content: string): Promise<boolean> {
  try {
    await user.send(content);
    return true;
  } catch (error: unknown) {
    logger.error(`Failed to send direct message: ${JSON.stringify(error, undefined, 2)}`);
    return false;
  }
}
