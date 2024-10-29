import type { ModalSubmitInteraction } from "discord.js";
import type { Logger } from "./logger.js";
import { getEnv } from "./helpers/environment.js";
import { logUser } from "./helpers/logUser.js";
import { handleConfirmRejectModal } from "./modals/confirmRejectTrack.js";

/**
 * Performs actions from a Discord modal interaction.
 * The interaction is ignored if the interaction is from a bot.
 *
 * @param interaction The Discord interaction to handle.
 * @param logger The logger to talk to about what's going on.
 */
export async function handleModal(
	interaction: ModalSubmitInteraction,
	logger: Logger,
): Promise<void> {
	// Don't respond to bots unless we're being tested
	if (
		interaction.user.bot &&
		(interaction.user.id !== getEnv("CORDE_BOT_ID") || getEnv("NODE_ENV") !== "test-e2e")
	) {
		logger.silly("Momma always said not to talk to strangers. They could be *bots* ");
		return;
	}

	// Ignore self interactions
	if (interaction.user.id === interaction.client.user?.id) return;

	// Handle form submission
	logger.debug(`User ${logUser(interaction.user)} submitted modal: '${interaction.customId}'`);

	// Our only modal so far is track reject confirmation
	await handleConfirmRejectModal(interaction, logger);
}
