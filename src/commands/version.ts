import type { Command } from "./Command.js";
import { changelog } from "../constants/repository.js";
import { localizations, ti } from "../i18n.js";
import { version as gamgeeVersion } from "../version.js";
import { randomCelebration, unwrappingFirstWith } from "../helpers/randomStrings.js";

export const version: Command = {
	name: "version",
	nameLocalizations: localizations("commands.version.name"),
	description: "Display the bot's current codebase version.",
	descriptionLocalizations: localizations("commands.version.description"),
	requiresGuild: false,
	async execute({ type, client, user, guildLocale, reply }) {
		const celebration = unwrappingFirstWith(
			{
				me: client.user.username,
				otherUser: user,
				otherMember: null,
			},
			randomCelebration(),
		);

		const systemName = "Gamgee";

		if (type === "interaction") {
			// Discord lets bots link stuff in Markdown syntax, but it'll also embed by default.
			// We use angled brackets (`<` and `>`) to prevent the embed.
			return await reply(
				`${ti(
					"commands.version.response",
					{ version: `[${systemName} v${gamgeeVersion}](<${changelog}>)` },
					guildLocale,
				)}  ${celebration}`,
			);
		}

		// Normal messages don't do Markdown links  :sadge:
		return await reply(
			`${ti(
				"commands.version.response",
				{ version: systemName },
				guildLocale,
			)} v${gamgeeVersion}  ${celebration}`,
		);
	},
};
