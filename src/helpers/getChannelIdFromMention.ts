import type { Snowflake } from "discord.js";

/**
 * Get a channel ID from a mention string.
 *
 * @param mention The mention string, in the form `<#[0-9]>`.
 *
 * @returns The ID string between the mention markers.
 */
export default function getChannelIdFromMention(mention: string): Snowflake | null {
	let id = mention.slice();
	if (!id) return null;

	const startsRight = id.startsWith("<#");
	const endsRight = id.endsWith(">");

	if (startsRight && endsRight) {
		id = id.slice(2, -1);

		if (id === "") return null;

		return id as Snowflake;
	}

	return null;
}
