import type { Command } from "./Command.js";
import { describeAllCommands } from "../actions/describeAllCommands.js";

export const help: Command = {
	name: "help",
	description: "Print a handy help message.",
	requiresGuild: false,
	async execute(context) {
		// Dynamic import here, b/c ./index depends on us to resolve
		const { allCommands } = await import("./index.js");

		const descriptions = await describeAllCommands(context, allCommands);
		return context.replyPrivately(`Commands:\n${descriptions}`);
	}
};
