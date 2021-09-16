import type { Subcommand } from "../Command";
import { MessageEmbed } from "discord.js";
import { useQueue } from "../../actions/queue/useQueue";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import durationString from "../../helpers/durationString";

const stats: Subcommand = {
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
		const queue = useQueue(queueChannel);
		const [count, playtimeRemaining, playtimeTotal, playtimeAverage] = await Promise.all([
			queue.count(),
			queue.playtimeRemaining(),
			queue.playtimeTotal(),
			queue.playtimeAverage()
		]);
		const playtimePlayed = playtimeTotal - playtimeRemaining;
		logger.info(
			`Info requested: ${durationString(playtimePlayed)} of ${durationString(
				playtimeTotal
			)} played. (${durationString(playtimeRemaining)} remaining in queue)`
		);

		const embed = new MessageEmbed().setTitle(`Statistics for #${queueChannel.name}`);
		if (count === 0) {
			embed.setDescription("Empty queue");
		} else {
			embed.addField("Total Entries", `${count}`);
			embed.addField("Average Song Playtime", durationString(playtimeAverage, true));
			embed.addField("Total Playtime", durationString(playtimeTotal, true));
			embed.addField("Played", `${durationString(playtimePlayed, true)}`, true);
			embed.addField("Remaining Playtime", durationString(playtimeRemaining, true), true);
			// TODO: Include the number of submitters who used up their count limit
		}

		await Promise.all([
			queueIsCurrent ? reply({ embeds: [embed] }) : replyPrivately({ embeds: [embed] }),
			deleteInvocation()
		]);
	}
};

export default stats;
