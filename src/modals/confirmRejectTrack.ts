import { getStoredEntry, type QueueEntry } from "../useQueueStorage.js";
import {
	ActionRowBuilder,
	type Message,
	ModalBuilder,
	type ModalSubmitInteraction,
	TextInputBuilder,
	TextInputStyle,
	type ModalActionRowComponentBuilder,
	type Client,
} from "discord.js";
import type { Logger } from "../logger.js";
import { DEFAULT_LOCALE, localeIfSupported, t, ti, type SupportedLocale } from "../i18n.js";
import { richErrorMessage } from "../helpers/richErrorMessage.js";
import { rejectQueueEntryFromMessage } from "../actions/rejectQueueEntry.js";
import { lastKnownLocaleForUser } from "../userLocalesCache.js";
import { getQueueChannelFromGuild } from "../actions/queue/getQueueChannel.js";

/** Users type this into the prompt to ensure this isn't an accident */
const MAGIC_WORD = "reject"; // TODO: Does this need i18n?

/** String that identifies the prompt text field. */
const MAGIC_WORD_FIELD_ID = "confirm-reject";

/** Prefix that identifies this modal from others that Gamgee might send. */
const CUSTOM_ID_PREFIX = "cfr";

function customIdForModalForEntry(entry: QueueEntry): string {
	// Up to 100 chars (see https://discordpy.readthedocs.io/en/stable/interactions/api.html#modal)
	return `${CUSTOM_ID_PREFIX}-${entry.guildId}-${entry.queueMessageId}`;
}

async function entryMessageFromModalCustomId(
	client: Client<true>,
	customId: string,
	logger: Logger,
): Promise<Message<true> | null> {
	if (!customId.startsWith(`${CUSTOM_ID_PREFIX}-`)) {
		throw new TypeError(
			`The given modal interaction did not have the expected custom ID prefix '${CUSTOM_ID_PREFIX}'. Actual custom ID: ${customId}`,
		);
	}

	const SEGMENT_COUNT = 3;
	const segments = customId.split("-");
	if (segments.length !== SEGMENT_COUNT) {
		throw new TypeError(
			`The given modal interaction's custom ID did not have the expected number of segments (${SEGMENT_COUNT}). Actual custom ID: ${customId}`,
		);
	}

	const guildId = segments[1];
	const queueMessageId = segments[2];
	if (!guildId || !queueMessageId) {
		throw new TypeError(
			`The given modal interaction's custom ID did not contain a guild or message ID. Actual custom ID: ${customId}`,
		);
	}

	const guild = await client.guilds.fetch(guildId);
	const queueChannel = await getQueueChannelFromGuild(guild);
	const message = await queueChannel?.messages.fetch(queueMessageId);
	if (message) {
		logger.debug(`Got message from modal ID '${customId}'`);
	}
	return message ?? null;
}

/**
 * Creates a modal to confirm rejection of the given entry.
 *
 * @param entry The entry to be rejected.
 * @param locale
 * @returns
 */
export async function createConfirmRejectModalForEntry(
	client: Client<true>,
	entry: QueueEntry,
	locale: SupportedLocale,
): Promise<ModalBuilder> {
	const customId = customIdForModalForEntry(entry);

	const user = await client.users.fetch(entry.senderId);
	const modal = new ModalBuilder() //
		.setCustomId(customId)
		.setTitle(ti("modals.confirm-reject-entry.title", { user: user.username }, locale));

	const confirmInput = new TextInputBuilder()
		.setCustomId(MAGIC_WORD_FIELD_ID)
		.setLabel(ti("modals.confirm-reject-entry.confirm-input", { confirm: MAGIC_WORD }, locale))
		.setStyle(TextInputStyle.Short)
		.setPlaceholder(MAGIC_WORD)
		.setMaxLength(MAGIC_WORD.length)
		.setRequired(true);

	const row = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(confirmInput);
	modal.addComponents(row);

	return modal;
}

/**
 * Handles a given modal interaction.
 */
export async function handleConfirmRejectModal(
	interaction: ModalSubmitInteraction,
	logger: Logger,
): Promise<void> {
	const userLocale =
		localeIfSupported(interaction.locale) ??
		localeIfSupported(interaction.guildLocale) ??
		DEFAULT_LOCALE;

	let message: Message<true> | null;
	try {
		message = await entryMessageFromModalCustomId(interaction.client, interaction.customId, logger);
	} catch (error) {
		logger.error(richErrorMessage("Failed to get message for modal.", error));
		throw error;
	}

	if (!message) {
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

	const confirm = interaction.fields.getTextInputValue(MAGIC_WORD_FIELD_ID).toLowerCase();
	if (confirm !== MAGIC_WORD) {
		await interaction.reply({
			content: ti(
				"modals.confirm-reject-entry.responses.wrong-word",
				{ confirm: MAGIC_WORD },
				userLocale,
			),
			ephemeral: true,
		});
		return;
	}

	const entry = await getStoredEntry(message.id);
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

	try {
		const senderLocaleString = lastKnownLocaleForUser(entry.senderId);
		const senderLocale =
			localeIfSupported(senderLocaleString) ??
			localeIfSupported(interaction.guildLocale) ??
			DEFAULT_LOCALE;

		// We're about to delete the message, so defer:
		await interaction.deferReply({ ephemeral: true });

		// Do the delete...
		await rejectQueueEntryFromMessage(message, senderLocale, logger);

		// "Follow-up" instead of "Reply" because the source message is gone now
		await interaction.followUp({
			content: t("modals.confirm-reject-entry.responses.success", userLocale),
			ephemeral: true,
		});
	} catch (error) {
		logger.error(richErrorMessage(`Failed to reply to interaction`, error));
	}
}
