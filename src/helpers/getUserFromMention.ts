import type { Guild, User } from "discord.js";
import { getUserIdFromMention } from "./getUserIdFromMention.js";
import { getUserWithId } from "./getUserWithId.js";
import { logUser } from "./logUser.js";
import { useLogger } from "../logger.js";

const logger = useLogger();

/**
 * Get a Discord user from a mention string.
 *
 * @see https://discordjs.guide/miscellaneous/parsing-mention-arguments.html#implementation
 * @param guild The guild in which to search for the user.
 * @param mention The mention string, in the form `<@!?[0-9]>`.
 * @returns A Discord user, or `null` if the user cannot be found.
 */
export async function getUserFromMention(guild: Guild, mention: string): Promise<User | null> {
	const userId = getUserIdFromMention(mention);
	if (userId === null) return null;

	const user = await getUserWithId(guild, userId);

	logger.debug(`Found user ${logUser(user)}`);
	return user;
}
