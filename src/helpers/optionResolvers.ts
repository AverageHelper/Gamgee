import type { CommandInteractionOption, Guild, GuildBasedChannel, User } from "discord.js";
import { ApplicationCommandOptionType } from "discord.js";
import { getChannelFromMention } from "./getChannelFromMention.js";
import { getUserFromMention } from "./getUserFromMention.js";

export async function resolveUserFromOption(
	option: CommandInteractionOption,
	guild: Guild
): Promise<User | null> {
	if (option.type === ApplicationCommandOptionType.User) {
		return option.user ?? null;
	}

	const userMention = option.value as string | undefined;
	if (userMention === undefined) return null;
	return await getUserFromMention(guild, userMention);
}

export function resolveChannelFromOption(
	option: CommandInteractionOption<"cached">,
	guild: Guild
): GuildBasedChannel | null {
	if (option.type === ApplicationCommandOptionType.Channel) {
		const channel = option.channel;
		if (!channel) return null;

		// Guild channels aren't DMs.
		if (channel.isDMBased()) return null;

		return channel;
	}

	let channelMention: string;
	if (option.value === undefined) {
		return null;
	} else if (typeof option.value === "string") {
		channelMention = option.value;
	} else if (typeof option.value === "boolean") {
		channelMention = option.value ? "true" : "false";
	} else {
		channelMention = `${option.value}`;
	}
	return getChannelFromMention(guild, channelMention);
}

export function resolveStringFromOption(option: CommandInteractionOption): string {
	if (option.type === ApplicationCommandOptionType.String) {
		return option.value as string;
	}

	return option.value?.toString() ?? "";
}

export function resolveIntegerFromOption(option: CommandInteractionOption): number | null {
	if (option.type === ApplicationCommandOptionType.Integer) {
		return (option.value as number | undefined) ?? null;
	}

	const value = resolveStringFromOption(option);
	if (value === "null") return null;

	// TODO: Should we just fail if the value isn't an integer?
	return Number.parseInt(value, 10);
}

export function resolveSubcommandNameFromOption(option: CommandInteractionOption): string {
	return option.name;
}
