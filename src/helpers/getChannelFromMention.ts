import type Discord from "discord.js";
import getChannelIdFromMention from "./getChannelIdFromMention.js";
import { useLogger } from "../logger.js";

const logger = useLogger();

/**
 * Get a Discord channel from a mention string.
 *
 * @param client The Discord client.
 * @param mention The mention string, in the form `<#[0-9]>`.
 * @returns A Discord channel, or `undefined` if the user cannot be determined from the providedd `mention` string.
 */
export function getChannelFromMention(
	guild: Discord.Guild | null,
	mention: string
): Discord.GuildChannel | Discord.ThreadChannel | undefined {
	const channelId = getChannelIdFromMention(mention);
	if (channelId === null) return undefined;

	const channel = guild?.channels.resolve(channelId) ?? undefined;

	if (channel) {
		logger.debug(`Found channel ${channel.name}`);
	} else {
		logger.debug("Did not find channel.");
	}

	return channel;
}

export default getChannelFromMention;
