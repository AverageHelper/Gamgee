import type Discord from "discord.js";
import getUserIdFromMention from "./getUserIdFromMention";
import { useLogger } from "../logger";
import logUser from "./logUser";

const logger = useLogger();

/**
 * Get a Discord user from a mention string.
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
  const userId = getUserIdFromMention(mention);
  if (userId === null || userId === "") return undefined;

  const user = (await message.guild?.members.fetch(userId))?.user;

  if (user) {
    logger.debug(`Found user ${logUser(user)}`);
  } else {
    logger.debug("Did not find user.");
  }

  return user;
}
