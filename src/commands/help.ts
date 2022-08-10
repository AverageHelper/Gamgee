import type { Command } from "./Command.js";
import { describeAllCommands } from "../actions/describeAllCommands.js";

export const help: Command = {
	name: "help",
	nameLocalizations: {
		de: "hilfe",
		"en-GB": "help",
		"en-US": "help",
		"es-ES": "ayuda",
		fr: "aider",
		"pt-BR": "ajuda"
	},
	description: "Print a handy help message.",
	descriptionLocalizations: {
		de: "Drucken Sie eine nützliche Hilfenachricht.",
		"en-GB": "Print a useful help message.",
		"en-US": "Print a handy help message.",
		"es-ES": "Imprime un mensaje de ayuda útil.",
		fr: "Imprimez un message d'aide utile.",
		"pt-BR": "Imprima uma mensagem de ajuda útil."
	},
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
