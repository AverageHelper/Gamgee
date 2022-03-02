import type { Command } from "./Command.js";
import { allLimits } from "./queue/limit.js";
import { getQueueConfig } from "../useQueueStorage.js";
import { MessageEmbed } from "discord.js";
import { MILLISECONDS_IN_SECOND } from "../constants/time.js";
import { useQueue } from "../actions/queue/useQueue.js";
import durationString from "../helpers/durationString.js";
import getQueueChannel from "../actions/queue/getQueueChannel.js";

const limits: Command = {
	name: "limits",
	description: "Display the song queue's submission limits.",
	requiresGuild: true,
	async execute({ type, user, guild, reply, followUp }) {
		const queueChannel = await getQueueChannel(guild);
		if (!queueChannel) {
			return reply("No queue is set up.");
		}

		const queue = useQueue(queueChannel);
		const config = await getQueueConfig(queueChannel);

		// Read out the existing limits
		const embed = new MessageEmbed().setTitle("Queue Limits");

		allLimits.forEach(key => {
			let value: string;
			switch (key.value) {
				case "cooldown":
					if (config.cooldownSeconds !== null && config.cooldownSeconds > 0) {
						value = durationString(config.cooldownSeconds);
					} else {
						value = "none";
					}
					break;
				case "entry-duration":
					if (config.entryDurationSeconds !== null && config.entryDurationSeconds > 0) {
						value = durationString(config.entryDurationSeconds);
					} else {
						value = "infinite";
					}
					break;
				case "count":
					if (config.submissionMaxQuantity !== null && config.submissionMaxQuantity > 0) {
						value = config.submissionMaxQuantity.toString();
					} else {
						value = "infinite";
					}
					break;
			}

			embed.addField(`${key.name}:\t${value}`, key.description);
		});

		await reply({ embeds: [embed], ephemeral: true });

		if (type !== "interaction") return;

		// If the user is blacklisted, they have no limit usage :P
		if (config.blacklistedUsers?.some(u => u.id === user.id)) return;

		// If the queue is open, display the user's limit usage
		const usageEmbed = new MessageEmbed().setTitle("Personal Statistics");
		const [latestSubmission, userSubmissionCount, avgDuration] = await Promise.all([
			queue.getLatestEntryFrom(user.id),
			queue.countFrom(user.id /* since: Date */),
			queue.getAveragePlaytimeFrom(user.id)
		]);

		// Average song length
		if (avgDuration > 0) {
			const name = "Average Song Length";
			const value = durationString(avgDuration);
			usageEmbed.addField(name, value);
		}

		// Total submissions
		if (config.submissionMaxQuantity !== null && config.submissionMaxQuantity > 0) {
			const name = "Total Submissions";
			const value = `${userSubmissionCount} of ${config.submissionMaxQuantity}`;
			usageEmbed.addField(name, value);
		}

		// Remaining wait time (if applicable)
		const userCanSubmitAgainLater =
			config.submissionMaxQuantity !== null &&
			config.submissionMaxQuantity > 0 &&
			userSubmissionCount < config.submissionMaxQuantity;
		if (userCanSubmitAgainLater) {
			const latestTimestamp = latestSubmission?.sentAt.getTime() ?? null;
			const timeSinceLatest =
				latestTimestamp !== null //
					? (Date.now() - latestTimestamp) / MILLISECONDS_IN_SECOND
					: null;
			const timeToWait =
				config.cooldownSeconds !== null && //
				config.cooldownSeconds > 0 &&
				timeSinceLatest !== null
					? Math.max(0, config.cooldownSeconds - timeSinceLatest)
					: 0;
			const name = "Remaining Wait Time";
			const value = `${durationString(timeToWait)}`;
			usageEmbed.addField(name, value);
		}

		await followUp({ embeds: [usageEmbed], ephemeral: true });
	}
};

export default limits;
