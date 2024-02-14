import type { GuildedCommand } from "./Command.js";
import { composed, createPartialString, push, pushNewLine } from "../helpers/composeStrings.js";
import { getCommandPrefix } from "../useGuildStorage.js";
import { localizations, ti } from "../i18n.js";
import { mentionCommand } from "../helpers/mentionCommands.js";
import { supportedPlatformsList } from "../constants/repository.js";

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

		// Print the standard help
		const COMMAND_PREFIX = await getCommandPrefix(guild);
		const msg = createPartialString();

		const exampleQuery = "https://youtu.be/dQw4w9WgXcQ"; // :P

		const srMention = mentionCommand(sr, guild, COMMAND_PREFIX);
		push(
			ti(
				"commands.howto.responses.to-submit",
				{
					command: srMention,
					example: `\`/${srCommandName} ${exampleQuery}\``
				},
				guildLocale
			),
			msg
		);
		pushNewLine(msg);

		const supportedPlatforms =
			type === "interaction"
				? ti(
						"commands.howto.responses.see-supported-platforms",
						{ url: `<${supportedPlatformsList}>` },
						guildLocale
				  )
				: ti(
						"commands.howto.responses.see-supported-platforms-at-url",
						{ url: `<${supportedPlatformsList}>` },
						guildLocale
				  );
		push(supportedPlatforms, msg);
		pushNewLine(msg);
		pushNewLine(msg);

		const npMention = mentionCommand(nowPlaying, guild, COMMAND_PREFIX);
		push(
			ti("commands.howto.responses.to-get-current-song", { command: npMention }, guildLocale),
			msg
		);

		return await reply(composed(msg));
	}
};
