import type Discord from "discord.js";
import type { Logger } from "./logger";
import type { Storage } from "./configStorage";
import { DELETE_BUTTON, DONE_BUTTON, RESTORE_BUTTON } from "./buttons";
import { useQueue } from "./actions/queue/useQueue";
import { getEnv } from "./helpers/environment";
import { getUserWithId } from "./helpers/getUserWithId";
import { sendPrivately } from "./actions/messages";
import { useGuildStorage } from "./useGuildStorage";
import logUser from "./helpers/logUser";
import getQueueChannel from "./actions/queue/getQueueChannel";
import richErrorMessage from "./helpers/richErrorMessage";
import StringBuilder from "./helpers/StringBuilder";

/**
 * Performs actions from a Discord command interaction.
 * The command is ignored if the interaction is from a bot.
 *
 * @param client The Discord client.
 * @param message The Discord message to handle.
 * @param storage Arbitrary persistent storage.
 */
export async function handleMessageComponent(
	client: Discord.Client,
	interaction: Discord.MessageComponentInteraction,
	storage: Storage | null,
	logger: Logger
): Promise<void> {
	// Don't respond to bots unless we're being tested
	if (
		interaction.user.bot &&
		(interaction.user.id !== getEnv("CORDE_BOT_ID") || getEnv("NODE_ENV") !== "test")
	) {
		logger.silly("Momma always said not to talk to strangers. They could be *bots* ");
		return;
	}

	// Ignore self interactions
	if (interaction.user.id === client.user?.id) return;

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

	const message = await queueChannel.messages.fetch(interaction.message.id);
	const queue = useQueue(queueChannel);
	const entry = await queue.getEntryFromMessage(interaction.message.id);
	if (!entry) {
		logger.debug("The message does not represent a known song request.");
		try {
			await interaction.reply({
				content: "I don't recognize that entry. Sorry  :slight_frown:",
				ephemeral: true
			});
		} catch (error: unknown) {
			logger.error(richErrorMessage(`Failed to reply to interaction`, error));
		}
		return;
	}

	logger.debug(
		`Got entry from message ${entry.queueMessageId} (${entry.isDone ? "Done" : "Not done"})`
	);

	switch (interaction.customId) {
		case DONE_BUTTON.id:
			logger.debug("Marking done....");
			await queue.markDone(message);
			logger.debug("Marked an entry done.");
			try {
				await interaction.deferUpdate();
			} catch (error: unknown) {
				logger.error(richErrorMessage(`Failed to defer update`, error));
			}
			break;

		case RESTORE_BUTTON.id:
			logger.debug("Marking undone....");
			await queue.markNotDone(message);
			logger.debug("Marked an entry undone");
			try {
				await interaction.deferUpdate();
			} catch (error: unknown) {
				logger.error(richErrorMessage(`Failed to defer update`, error));
			}
			break;

		case DELETE_BUTTON.id: {
			logger.debug("Deleting entry...");
			const entry = await queue.deleteEntryFromMessage(message);
			if (!entry) {
				logger.debug("There was no entry to delete.");
				break;
			}
			logger.debug("Deleted an entry");

			const userId = entry.senderId;
			const guild = interaction.guild;
			if (!guild) {
				logger.debug(`Queue message ${message.id} has no guild.`);
				return;
			}
			const guildStorage = useGuildStorage(guild);
			const user = await getUserWithId(guild, userId);

			logger.verbose(`Informing User ${logUser(user)} that their song was rejected...`);
			const builder = new StringBuilder();
			builder.push(":persevere:\nI'm very sorry. Your earlier submission was rejected: ");
			builder.push(entry.url);

			await sendPrivately(user, builder.result());

			if (await guildStorage.isQueueOpen()) {
				await new Promise(resolve => setTimeout(resolve, 2000));
				await sendPrivately(user, "You can resubmit another song if you'd like to. :slight_smile:");
			}
			break;
		}

		default:
			break;
	}
}
