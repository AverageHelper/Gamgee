import type Discord from "discord.js";
import { getChannelIdFromMention } from "./getChannelIdFromMention.js";
import { useLogger } from "../logger.js";

const logger = useLogger();

/**
 * Get a Discord channel from a mention string.
 *
 * @param guild The guild in which the channel lives.
 * @param mention The mention string, in the form `<#[0-9]>`.
 * @returns A Discord channel, or `null` if the user cannot be determined from the provided `mention` string.
 */
export function getChannelFromMention(
	guild: Discord.Guild,
	mention: string
): Discord.GuildBasedChannel | null {
	const channelId = getChannelIdFromMention(mention);
	if (channelId === null) return null;

	const channel = guild.channels.resolve(channelId);

	if (channel) {
		logger.debug(`Found channel ${channel.name}`);
	} else {
		logger.debug("Did not find channel.");
	}

	return channel;
}
