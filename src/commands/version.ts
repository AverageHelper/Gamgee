import type { Command } from "./Command.js";
import { localizations } from "../i18n.js";
import { version as gamgeeVersion } from "../version.js";
import { randomCelebration, unwrappingFirstWith } from "../helpers/randomStrings.js";

// TODO: i18n
export const version: Command = {
	name: "version",
	nameLocalizations: localizations("commands.version.name"),
	description: "Display the bot's current codebase version.",
	descriptionLocalizations: localizations("commands.version.description"),
	requiresGuild: false,
	async execute({ type, client, user, reply }) {
		const celebration = unwrappingFirstWith(
			{
				me: client.user.username,
				otherUser: user,
				otherMember: null
			},
			randomCelebration()
		);

		const systemName = "Gamgee Core";

		if (type === "interaction") {
			const repo = "https://github.com/AverageHelper/Gamgee";
			const changelog = `${repo}/blob/main/CHANGELOG.md`; // TODO: Select the current version's heading
			// Discord lets bots link stuff in Markdown syntax, but it'll also embed by default.
			// We use angled brackets (`<` and `>`) to prevent the embed.
			return await reply(
				`I'm currently running [${systemName} v${gamgeeVersion}](<${changelog}>)  ${celebration}`
			);
		}

		// Normal messages don't do Markdown links  :sadge:
		return await reply(`I'm currently running ${systemName} v${gamgeeVersion}  ${celebration}`);
	}
};
