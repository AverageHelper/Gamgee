import type { Command } from "./Command";
import { version as gamgeeVersion } from "../version";
import { randomCelebration } from "../helpers/randomStrings";

const version: Command = {
	name: "version",
	description: "Display the bot's current codebase version.",
	requiresGuild: false,
	async execute({ reply }) {
		return reply(`I'm currently running Gamgee Core v${gamgeeVersion}.  ${randomCelebration()}`);
	}
};

export default version;
