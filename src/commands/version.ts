import type { Command } from "./Command.js";
import { version as gamgeeVersion } from "../version.js";
import { randomCelebration, unwrappingFirstWith } from "../helpers/randomStrings.js";

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
			// Discord lets bots link stuff in Markdown syntax, but it'll also embed by default. Use `<brackets>` to prevent the embed.
			const repo = "https://github.com/AverageHelper/Gamgee";
			const source = `${repo}/tree/v${gamgeeVersion}`;
			const changelog = `${repo}/releases/tag/v${gamgeeVersion}`;
			return reply(
				`I'm currently running [Gamgee Core v${gamgeeVersion}](<${source}>)  ${celebration}\nYou can [read the changelog](<${changelog}>) on GitHub!`
			);
		}

		// Normal messages don't do Markdown links  :sadge:
		return reply(`I'm currently running Gamgee Core v${gamgeeVersion}.  ${celebration}`);
	}
};

export default version;
