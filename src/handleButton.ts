import type { ButtonInteraction } from "discord.js";
import type { Logger } from "./logger.js";
import { DELETE_BUTTON, DONE_BUTTON, RESTORE_BUTTON } from "./buttons.js";
import { getEnv } from "./helpers/environment.js";
import { getQueueChannel } from "./actions/queue/getQueueChannel.js";
import { getStoredEntry } from "./useQueueStorage.js";
import { logUser } from "./helpers/logUser.js";
import { markEntryDoneInQueue, markEntryNotDoneInQueue } from "./actions/queue/useQueue.js";
import { richErrorMessage } from "./helpers/richErrorMessage.js";
import { DEFAULT_LOCALE, localeIfSupported, t } from "./i18n.js";
import { createConfirmRejectModalForEntry } from "./modals/confirmRejectTrack.js";

/**
 * Performs actions from a Discord command interaction.
 * The command is ignored if the interaction is from a bot.
 *
 * @param interaction The Discord interaction to handle.
 * @param logger The logger to talk to about what's going on.
 */
export async function handleButton(interaction: ButtonInteraction, logger: Logger): Promise<void> {
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

	// Handle Button Presses
	logger.debug(`User ${logUser(interaction.user)} actuated button: '${interaction.customId}'`);

	const queueChannel = await getQueueChannel(interaction.guild);
	if (!queueChannel) {
		logger.debug("There is no queue channel for this guild.");
		return;
	}
	if (interaction.channel?.id !== queueChannel.id) {
		logger.debug("This isn't the queue channel. Ignoring.");
		return;
	}

	const userLocale =
		localeIfSupported(interaction.locale) ??
		localeIfSupported(interaction.guildLocale) ??
		DEFAULT_LOCALE;
	const entry = await getStoredEntry(interaction.message.id);
	if (!entry) {
		logger.debug("The message does not represent a known song request.");
		try {
			await interaction.reply({
				content: `${t("modals.confirm-reject-entry.responses.unknown-entry", userLocale)}  :slight_frown:`,
				ephemeral: true,
			});
		} catch (error) {
			logger.error(richErrorMessage(`Failed to reply to interaction`, error));
		}
		return;
	}

	logger.debug(
		`Got entry from message ${entry.queueMessageId} (${entry.isDone ? "Done" : "Not done"})`,
	);

	const message = await queueChannel.messages.fetch(interaction.message.id);

	switch (interaction.customId) {
		case DONE_BUTTON.id:
			try {
				await interaction.deferUpdate();
				logger.debug("Marking done....");
				await markEntryDoneInQueue(message, queueChannel);
				logger.debug("Marked an entry done.");
			} catch (error) {
				logger.error(richErrorMessage(`Failed to defer update`, error));
			}
			break;

		case RESTORE_BUTTON.id:
			try {
				await interaction.deferUpdate();
				logger.debug("Marking undone....");
				await markEntryNotDoneInQueue(message, queueChannel);
				logger.debug("Marked an entry undone");
			} catch (error) {
				logger.error(richErrorMessage(`Failed to defer update`, error));
			}
			break;

		case DELETE_BUTTON.id: {
			const modalLocale =
				localeIfSupported(interaction.locale) ??
				localeIfSupported(interaction.guildLocale) ??
				DEFAULT_LOCALE;
			const modal = await createConfirmRejectModalForEntry(interaction.client, entry, modalLocale);
			try {
				logger.debug(
					`Showing reject modal to ${logUser(interaction.user)} with locale ${modalLocale}`,
				);
				await interaction.showModal(modal);
			} catch (error) {
				logger.error(richErrorMessage(`Failed to show reject modal`, error));
			}
			break;
		}

		default:
			break;
	}
}
