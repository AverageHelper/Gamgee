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
			return reply(`No queue is set up. Would you like to start one?`);
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
			embed.addField("Total Entries", `${count}`);
			embed.addField("Average Song Playtime", formattedPlaytimeAverage);
			embed.addField("Total Playtime", formattedPlaytimeTotal);
			embed.addField("Played", `${formattedPlaytimePlayed}`, true);
			embed.addField("Remaining Playtime", formattedPlaytimeRemaining, true);
			// TODO: Include the number of submitters who used up their count limit
		} catch (error) {
			logger.error(richErrorMessage("Failed to generate queue statistics message.", error));
			return replyPrivately(
				"Something went wrong with setting up the statistics. Sorry :frowning:"
			);
		}

		await Promise.all([
			queueIsCurrent ? reply({ embeds: [embed] }) : replyPrivately({ embeds: [embed] }),
			deleteInvocation()
		]);
	}
};
