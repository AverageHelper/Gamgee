import type { Command } from "./Command.js";
import { version as gamgeeVersion } from "../version.js";
import { randomCelebration } from "../helpers/randomStrings.js";

const version: Command = {
	name: "version",
	description: "Display the bot's current codebase version.",
	requiresGuild: false,
	async execute({ reply, user, type }) {
		const celebration = randomCelebration().unwrapFirstWith({
			me: "Me",
			otherUser: user,
			otherMember: null
		});

		if (type === "interaction") {
			// Discord lets bots link stuff in Markdown syntax, but it'll also embed by default. Use `<brackets>` to prevent the embed.
			const repo = `https://github.com/AverageHelper/Gamgee/tree/v${gamgeeVersion}`;
			return reply(
				`I'm currently running Gamgee Core [v${gamgeeVersion}](<${repo}>)  ${celebration}`
			);
		}

		// Normal messages don't do Markdown links  :sadge:
		return reply(`I'm currently running Gamgee Core v${gamgeeVersion}.  ${celebration}`);
	}
};

export default version;
