import { cacheLocaleFromInteraction } from "../userLocalesCache.js";
import { handleButton } from "../handleButton.js";
import { handleInteraction } from "../handleInteraction.js";
import { handleModal } from "../handleModal.js";
import { InteractionType } from "discord.js";
import { onEvent } from "../helpers/onEvent.js";

export const interactionCreate = onEvent("interactionCreate", {
	async execute(interaction, logger) {
		cacheLocaleFromInteraction(interaction);

		if (interaction.isChatInputCommand()) {
			await handleInteraction(interaction, logger);
		} else if (interaction.isButton()) {
			await handleButton(interaction, logger);
		} else if (interaction.isModalSubmit()) {
			await handleModal(interaction, logger);
		} else {
			logger.debug(`Unknown interaction type: ${InteractionType[interaction.type]}`);
		}
	},
});
