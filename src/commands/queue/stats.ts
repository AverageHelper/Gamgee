import type { Subcommand } from "../Command.js";
import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { countAllStoredEntries } from "../../useQueueStorage.js";
import { durationString } from "../../helpers/durationString.js";
import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
import { richErrorMessage } from "../../helpers/richErrorMessage.js";
import {
	playtimeAverageInQueue,
	playtimeRemainingInQueue,
	playtimeTotalInQueue
} from "../../actions/queue/useQueue.js";

// TODO: i18n
export const stats: Subcommand = {
	name: "stats",
	description: "Print statistics on the current queue.",
	type: ApplicationCommandOptionType.Subcommand,
	requiresGuild: true,
	async execute({ userLocale, guild, logger, replyPrivately, deleteInvocation }) {
		await deleteInvocation();

		const queueChannel = await getQueueChannel(guild);

		if (!queueChannel) {
			return await replyPrivately(`No queue is set up. Would you like to start one?`);
		}

		// Get the current queue's statistics
		const [count, playtimeRemaining, playtimeTotal, playtimeAverage] = await Promise.all([
			countAllStoredEntries(queueChannel),
			playtimeRemainingInQueue(queueChannel),
			playtimeTotalInQueue(queueChannel),
			playtimeAverageInQueue(queueChannel)
		]);
		const playtimePlayed = playtimeTotal - playtimeRemaining;

		const formattedPlaytimeAverage = durationString(userLocale, playtimeAverage, true);
		const formattedPlaytimePlayed = durationString(userLocale, playtimePlayed, true);
		const formattedPlaytimeTotal = durationString(userLocale, playtimeTotal, true);
		const formattedPlaytimeRemaining = durationString(userLocale, playtimeRemaining, true);

		logger.info(
			`Info requested: ${formattedPlaytimePlayed} of ${formattedPlaytimeTotal} played. (${formattedPlaytimeRemaining} remaining in queue)`
		);

		const embed = new EmbedBuilder() //
			.setTitle("Queue Statistics")
			.setDescription(`<#${queueChannel.id}>`);

		try {
			embed.addFields({ name: "Total Entries", value: `${count}` });
			embed.addFields({ name: "Average Song Playtime", value: formattedPlaytimeAverage });
			embed.addFields({ name: "Total Playtime", value: formattedPlaytimeTotal });
			embed.addFields({ name: "Played", value: formattedPlaytimePlayed, inline: true });
			embed.addFields({
				name: "Remaining Playtime",
				value: formattedPlaytimeRemaining,
				inline: true
			});
			// TODO: Include the number of submitters who used up their count limit
		} catch (error) {
			logger.error(richErrorMessage("Failed to generate queue statistics message.", error));
			return await replyPrivately(
				"Something went wrong with setting up the statistics. Sorry :frowning:"
			);
		}

		await replyPrivately({ embeds: [embed] });
	}
};
