import type Discord from "discord.js";
import { getChannelFromMention } from "./getChannelFromMention.js";
import { getUserFromMention } from "./getUserFromMention.js";

export async function resolveUserFromOption(
	option: Discord.CommandInteractionOption,
	guild: Discord.Guild
): Promise<Discord.User | null> {
	if (option.type === "USER") {
		return option.user ?? null;
	}

	const userMention = option.value as string | undefined;
	if (userMention === undefined) return null;
	return (await getUserFromMention(guild, userMention)) ?? null;
}

export function resolveChannelFromOption(
	option: Discord.CommandInteractionOption,
	guild: Discord.Guild
): Discord.GuildChannel | Discord.ThreadChannel | null {
	if (option.type === "CHANNEL") {
		const channel = (option.channel as Discord.Channel | undefined) ?? null;
		if (!channel) return null;

		// Guild channels aren't DMs or group DMs. Their type is also known.
		switch (channel.type) {
			case "DM":
			case "GROUP_DM":
			case "UNKNOWN":
				return null;

			default:
				return channel as Discord.GuildChannel | null;
		}
	}

	const channelMention = option.value as string | undefined;
	if (channelMention === undefined) return null;
	return getChannelFromMention(guild, channelMention) ?? null;
}

export function resolveStringFromOption(option: Discord.CommandInteractionOption): string {
	if (option.type === "STRING") {
		return option.value as string;
	}

	return option.value?.toString() ?? "";
}

export function resolveIntegerFromOption(option: Discord.CommandInteractionOption): number | null {
	if (option.type === "INTEGER") {
		return (option.value as number | undefined) ?? null;
	}

	const value = resolveStringFromOption(option);
	if (value === "null") return null;

	return Number.parseInt(value, 10);
}

export function resolveSubcommandNameFromOption(option: Discord.CommandInteractionOption): string {
	return option.name;
}
