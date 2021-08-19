import type { Snowflake } from "discord.js";

/**
 * Get a user ID from a mention string.
 * @see https://discordjs.guide/miscellaneous/parsing-mention-arguments.html#implementation
 *
 * @param mention The mention string, in the form `<@!?[0-9]>`.
 *
 * @returns The ID string between the mention markers.
 */
export default function getUserIdFromMention(mention: string): Snowflake | null {
	let id = mention.slice();
	if (!id) return null;

	const startsRight = id.startsWith("<@");
	const endsRight = id.endsWith(">");

	if (startsRight && endsRight) {
		id = id.slice(2, -1);

		if (id.startsWith("!")) {
			id = id.slice(1);
		}

		if (id === "") return null;

		return id /* as Snowflake*/;
	}

	return null;
}
