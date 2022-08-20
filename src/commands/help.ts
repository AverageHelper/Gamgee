import type { Command } from "./Command.js";
import { composed, createPartialString, push, pushNewLine } from "../helpers/composeStrings.js";
import { describeAllCommands } from "../actions/describeAllCommands.js";
import { localizations, t } from "../i18n.js";

export const help: Command = {
	name: "help",
	nameLocalizations: localizations("commands.help.name"),
	description: "Print a handy help message.",
	descriptionLocalizations: localizations("commands.help.description"),
	requiresGuild: false,
	async execute(context) {
		// Dynamic import here, b/c ./index depends on us to resolve
		const { allCommands } = await import("./index.js");

		const locale = context.userLocale;

		const descriptions = await describeAllCommands(context, allCommands, locale);
		const response = createPartialString(t("commands.help.response", locale));
		pushNewLine(response);
		push(descriptions, response);
		return await context.replyPrivately(composed(response));
	}
};
