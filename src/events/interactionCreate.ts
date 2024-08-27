import { cacheLocaleFromInteraction } from "../i18nCache.js";
import { handleButton } from "../handleButton.js";
import { handleInteraction } from "../handleInteraction.js";
import { onEvent } from "../helpers/onEvent.js";

export const interactionCreate = onEvent("interactionCreate", {
	async execute(interaction, logger) {
		cacheLocaleFromInteraction(interaction);

		if (interaction.isChatInputCommand()) {
			await handleInteraction(interaction, logger);
		} else if (interaction.isButton()) {
			await handleButton(interaction, logger);
		}
	},
});
