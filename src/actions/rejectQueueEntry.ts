import type { Logger } from "../logger.js";
import type { Message } from "discord.js";
import { t, type SupportedLocale } from "../i18n.js";
import { createPartialString, composed, push } from "../helpers/composeStrings.js";
import { deleteEntryFromMessage } from "../actions/queue/useQueue.js";
import { getUserWithId } from "../helpers/getUserWithId.js";
import { isQueueOpen } from "../useGuildStorage.js";
import { logUser } from "../helpers/logUser.js";
import { sendPrivately } from "../actions/messages/index.js";
import { timeoutSeconds } from "../helpers/timeoutSeconds.js";

/**
 * Rejects a user's song submission, given that song's message in the queue channel.
 * Sends a DM to the affected user.
 *
 * @param message The message which identifies the track to be rejected.
 * @param logger The logger to use to log messages about the rejection.
 */
export async function rejectQueueEntryFromMessage(
	message: Message<true>,
	locale: SupportedLocale,
	logger: Logger,
): Promise<void> {
	logger.debug("Deleting entry...");
	const entry = await deleteEntryFromMessage(message);
	if (!entry) {
		logger.debug("There was no entry to delete.");
		return;
	}
	logger.debug("Deleted an entry");

	const userId = entry.senderId;
	const guild = message.guild;
	if (!guild) {
		logger.debug(`Queue message ${message.id} has no guild.`);
		return;
	}
	const user = await getUserWithId(guild, userId);

	logger.verbose(
		`Informing User ${logUser(user)} that their song was rejected (using locale ${locale})...`,
	);
	const rejection = createPartialString();
	push(`:persevere:\n${t("dms.rejection-apology", locale)} `, rejection);
	push(entry.url, rejection);

	await sendPrivately(user, composed(rejection));

	if (await isQueueOpen(guild)) {
		await timeoutSeconds(2);
		await sendPrivately(user, `${t("dms.rejection-submit-another", locale)} :slight_smile:`);
	}
}
