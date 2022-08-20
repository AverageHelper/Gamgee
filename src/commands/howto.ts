import type { GuildedCommand } from "./Command.js";
import { getCommandPrefix } from "../useGuildStorage.js";
import { localizations } from "../i18n.js";
import { SLASH_COMMAND_INTENT_PREFIX } from "../constants/database.js";
import {
	composed,
	createPartialString,
	push,
	pushCode,
	pushNewLine
} from "../helpers/composeStrings.js";

// TODO: i18n
export const howto: GuildedCommand = {
	name: "howto",
	nameLocalizations: localizations("commands.howto.name"),
	description: "Print instructions for using the common queue commands.",
	descriptionLocalizations: localizations("commands.howto.description"),
	requiresGuild: true,
	async execute({ guildLocale, guild, type, reply }) {
		const { sr } = await import("./songRequest.js");
		const { nowPlaying } = await import("./nowPlaying.js");

		const srCommandName: string = sr.nameLocalizations
			? sr.nameLocalizations[guildLocale] ?? sr.name
			: sr.name;
		const nowPlayingCommandName: string = nowPlaying.nameLocalizations
			? nowPlaying.nameLocalizations[guildLocale] ?? nowPlaying.name
			: nowPlaying.name;

		// Print the standard help
		const COMMAND_PREFIX =
			type === "message" ? await getCommandPrefix(guild) : SLASH_COMMAND_INTENT_PREFIX;
		const msg = createPartialString();

		const exampleQuery = "https://youtu.be/dQw4w9WgXcQ"; // :P

		push(`To submit a song, type \`${COMMAND_PREFIX}${srCommandName} <link>\`.`, msg);
		pushNewLine(msg);
		push(`For example: \`${COMMAND_PREFIX}${srCommandName} ${exampleQuery}\``, msg);
		pushNewLine(msg);
		push("I will respond with a text verification indicating your song has joined the queue!", msg);
		pushNewLine(msg);

		const supportedPlatformsList =
			"https://github.com/AverageHelper/Gamgee#supported-music-platforms";
		const supportedPlatforms =
			type === "interaction"
				? `See [our list of supported platforms](<${supportedPlatformsList}>)`
				: `See our list of supported platforms at <${supportedPlatformsList}>.`;
		push(supportedPlatforms, msg);
		pushNewLine(msg);
		pushNewLine(msg);

		push("To get a link to the current song, type ", msg);
		pushCode(`${COMMAND_PREFIX}${nowPlayingCommandName}`, msg);
		if (type === "message") {
			push(" and check your DMs", msg);
		}
		push(".", msg);

		return await reply(composed(msg));
	}
};
