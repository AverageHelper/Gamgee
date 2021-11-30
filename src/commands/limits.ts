import type { Command } from "./Command";
import { allLimits } from "./queue/limit";
import { MessageEmbed } from "discord.js";
import { MILLISECONDS_IN_SECOND } from "../constants/time";
import { useQueue } from "../actions/queue/useQueue";
import durationString from "../helpers/durationString";
import getQueueChannel from "../actions/queue/getQueueChannel";

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
		const config = await queue.getConfig();

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

		allLimits.forEach(key => {
			let name = key.name;
			let value: string | undefined;

			switch (key.value) {
				case "cooldown": {
					// `sentAt` here, to be more lenient than `receivedAt` (which may be closer to now)
					const latestTimestamp = latestSubmission?.sentAt.getTime() ?? null;
					const timeSinceLatest =
						latestTimestamp !== null
							? (Date.now() - latestTimestamp) / MILLISECONDS_IN_SECOND
							: null;
					const timeToWait =
						config.cooldownSeconds !== null &&
						config.cooldownSeconds > 0 &&
						timeSinceLatest !== null
							? Math.max(0, config.cooldownSeconds - timeSinceLatest)
							: 0;
					name = "Remaining Wait Time";
					value = `${durationString(timeToWait)}`;
					break;
				}
				case "count":
					if (config.submissionMaxQuantity !== null && config.submissionMaxQuantity > 0) {
						name = "Total Submissions";
						value = `${userSubmissionCount} of ${config.submissionMaxQuantity}`;
					}
					break;
				case "entry-duration":
					// Put in the average
					if (avgDuration > 0) {
						name = "Average Song Length";
						value = durationString(avgDuration);
					}
					break;
			}

			if (value !== undefined) {
				usageEmbed.addField(name, value);
			}
		});

		await followUp({ embeds: [usageEmbed], ephemeral: true });
	}
};

export default limits;
