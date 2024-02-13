import type { GlobalCommand } from "./Command.js";
import { composed, createPartialString, push, pushNewLine } from "../helpers/composeStrings.js";
import { describeAllCommands } from "../actions/describeAllCommands.js";
import { getCommandPrefix } from "../useGuildStorage.js";
import { localizations, t } from "../i18n.js";
import { mentionCommand } from "../helpers/mentionCommands.js";

export const help: GlobalCommand = {
	name: "help",
	nameLocalizations: localizations("commands.help.name"),
	description: "Print a handy help message.",
	descriptionLocalizations: localizations("commands.help.description"),
	requiresGuild: false,
	async execute(context) {
		// Dynamic import here, b/c ./index depends on us to resolve
		const { allCommands } = await import("./index.js");

		const locale = context.userLocale;

		if (context.type === "message") {
			const prefix = await getCommandPrefix(context.guild);
			return await context.reply(
				`To see the list of commands, type \`/\` in the message bar. Try using ${mentionCommand(
					help,
					prefix
				)}`
			);
		}

		const descriptions = await describeAllCommands(context, allCommands, locale);
		const response = createPartialString(t("commands.help.response", locale));
		pushNewLine(response);
		push(descriptions, response);
		return await context.replyPrivately(composed(response));
	}
};
