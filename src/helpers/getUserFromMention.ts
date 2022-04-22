import type Discord from "discord.js";
import getUserIdFromMention from "./getUserIdFromMention.js";
import { getUserWithId } from "./getUserWithId.js";
import { useLogger } from "../logger.js";
import logUser from "./logUser.js";

const logger = useLogger();

/**
 * Get a Discord user from a mention string.
 *
 * @see https://discordjs.guide/miscellaneous/parsing-mention-arguments.html#implementation
 * @param client The Discord client.
 * @param mention The mention string, in the form `<@!?[0-9]>`.
 * @returns A Discord user, or `undefined` if the user cannot be found.
 */
export async function getUserFromMention(
	guild: Discord.Guild | null,
	mention: string
): Promise<Discord.User | undefined> {
	const userId = getUserIdFromMention(mention);
	if (userId === null) return undefined;

	if (!guild) return undefined;

	const user = await getUserWithId(guild, userId);

	logger.debug(`Found user ${logUser(user)}`);
	return user;
}

export default getUserFromMention;
