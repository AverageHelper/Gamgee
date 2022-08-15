import type { Command } from "./Command.js";
import { version as gamgeeVersion } from "../version.js";
import { randomCelebration, unwrappingFirstWith } from "../helpers/randomStrings.js";

// TODO: i18n
export const version: Command = {
	name: "version",
	description: "Display the bot's current codebase version.",
	requiresGuild: false,
	async execute({ reply, user, type }) {
		const celebration = unwrappingFirstWith(
			{
				me: "Me",
				otherUser: user,
				otherMember: null
			},
			randomCelebration()
		);

		if (type === "interaction") {
			const repo = "https://github.com/AverageHelper/Gamgee";
			const changelog = `${repo}/blob/main/CHANGELOG.md`;
			// Discord lets bots link stuff in Markdown syntax, but it'll also embed by default.
			// We use angled brackets (`<` and `>`) to prevent the embed.
			return await reply(
				`I'm currently running [Gamgee Core v${gamgeeVersion}](<${changelog}>)  ${celebration}`
			);
		}

		// Normal messages don't do Markdown links  :sadge:
		return await reply(`I'm currently running Gamgee Core v${gamgeeVersion}.  ${celebration}`);
	}
};
