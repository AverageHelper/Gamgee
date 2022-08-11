import type { Command } from "./Command.js";
import { describeAllCommands } from "../actions/describeAllCommands.js";
import { localizations } from "../i18n.js";

export const help: Command = {
	name: "help",
	nameLocalizations: localizations("commands.help.name"),
	description: "Print a handy help message.",
	descriptionLocalizations: localizations("commands.help.description"),
	requiresGuild: false,
	async execute(context) {
		// Dynamic import here, b/c ./index depends on us to resolve
		const { allCommands } = await import("./index.js");

		// if (context.type === "interaction") {
		//	// TODO: pass this somewhere to i18nlize the private output
		// 	context.interaction.locale
		// }

		const descriptions = await describeAllCommands(context, allCommands);
		return await context.replyPrivately(`Commands:\n${descriptions}`);
	}
};
