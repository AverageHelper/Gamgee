import type { Subcommand } from "../Command.js";
import { countAllEntries } from "../../useQueueStorage.js";
import { durationString } from "../../helpers/durationString.js";
import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
import { MessageEmbed } from "discord.js";
import { richErrorMessage } from "../../helpers/richErrorMessage.js";
import {
	playtimeAverageInQueue,
	playtimeRemainingInQueue,
	playtimeTotalInQueue
} from "../../actions/queue/useQueue.js";

export const stats: Subcommand = {
	name: "stats",
	description: "Print statistics on the current queue.",
	type: "SUB_COMMAND",
	requiresGuild: true,
	async execute({ guild, channel, logger, reply, replyPrivately, deleteInvocation }) {
		const queueChannel = await getQueueChannel(guild);

		if (!queueChannel) {
			return await reply(`No queue is set up. Would you like to start one?`);
		}

		// Get the current queue's statistics
		const queueIsCurrent = channel?.id === queueChannel.id;
		const [count, playtimeRemaining, playtimeTotal, playtimeAverage] = await Promise.all([
			countAllEntries(queueChannel),
			playtimeRemainingInQueue(queueChannel),
			playtimeTotalInQueue(queueChannel),
			playtimeAverageInQueue(queueChannel)
		]);
		const playtimePlayed = playtimeTotal - playtimeRemaining;

		const formattedPlaytimeAverage = durationString(playtimeAverage, true);
		const formattedPlaytimePlayed = durationString(playtimePlayed, true);
		const formattedPlaytimeTotal = durationString(playtimeTotal, true);
		const formattedPlaytimeRemaining = durationString(playtimeRemaining, true);

		logger.info(
			`Info requested: ${formattedPlaytimePlayed} of ${formattedPlaytimeTotal} played. (${formattedPlaytimeRemaining} remaining in queue)`
		);

		const embed = new MessageEmbed() //
			.setTitle("Queue Statistics")
			.setDescription(`<#${queueChannel.id}>`);

		try {
			embed.addFields({ name: "Total Entries", value: `${count}` });
			embed.addFields({ name: "Average Song Playtime", value: formattedPlaytimeAverage });
			embed.addFields({ name: "Total Playtime", value: formattedPlaytimeTotal });
			embed.addFields({ name: "Played", value: `${formattedPlaytimePlayed}`, inline: true });
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

		await Promise.all([
			queueIsCurrent ? reply({ embeds: [embed] }) : replyPrivately({ embeds: [embed] }),
			deleteInvocation()
		]);
	}
};
