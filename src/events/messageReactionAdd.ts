import type { MessageReaction, User } from "discord.js";
import { handleReactionAdd } from "../handleReactionAdd.js";
import { onEvent } from "../helpers/onEvent.js";
import { richErrorMessage } from "../helpers/richErrorMessage.js";

export const messageReactionAdd = onEvent("messageReactionAdd", {
	async execute(rxn, usr, logger) {
		try {
			// Only fetch if needed
			const reaction: MessageReaction = rxn.partial ? await rxn.fetch() : rxn;
			const user: User = usr.partial ? await usr.fetch() : usr;

			await handleReactionAdd(reaction, user, logger);
		} catch (error) {
			logger.error(richErrorMessage("Failed to handle reaction add.", error));
		}
	},
});
