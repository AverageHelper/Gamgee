import type { Command } from "./Command.js";
import { localizations, t as translate } from "../i18n.js";
import { timeoutSeconds } from "../helpers/timeoutSeconds.js";

export const t: Command = {
	name: "t",
	nameLocalizations: localizations("commands.t.name"),
	description: "Start a typing indicator.",
	descriptionLocalizations: localizations("commands.t.description"),
	requiresGuild: false,
	async execute({
		type,
		channel,
		userLocale,
		client,
		logger,
		replyPrivately,
		deleteInvocation,
		sendTyping,
	}) {
		await deleteInvocation();
		if (!channel) {
			logger.debug("Couldn't find the channel");
			return await replyPrivately(translate("commands.t.responses.channel-not-found", userLocale));
		}

		logger.debug(`I, ${client.user.username}, started typing in channel ${channel.id}`);
		if (type === "interaction") {
			// Silly response so the interaction knows it succeeded.
			// A message command doesn't need a response, and we don't want to DM the user about this.
			await replyPrivately(translate("commands.t.responses.success-cheeky", userLocale));
		}

		sendTyping();

		await timeoutSeconds(10); // this is roughly how long the typing indicator lasts on its own
		logger.debug(`Finished typing in channel ${channel.id}`);
	},
};
