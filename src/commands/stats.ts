import type { Command } from "./Command.js";
import { composed, createPartialString, push } from "../helpers/composeStrings.js";
import { durationString } from "../helpers/durationString.js";
import { getQueueChannel } from "../actions/queue/getQueueChannel.js";
import { MessageEmbed } from "discord.js";
import { MILLISECONDS_IN_SECOND } from "../constants/time.js";
import {
	averageSubmissionPlaytimeForUser,
	countAllEntriesFrom,
	fetchLatestEntryFrom,
	getQueueConfig
} from "../useQueueStorage.js";

export const stats: Command = {
	name: "stats",
	description: "Get your personal queue statistics.",
	requiresGuild: true,
	async execute({ user, guild, replyPrivately }) {
		const queueChannel = await getQueueChannel(guild);
		if (!queueChannel) {
			return replyPrivately("No queue is set up.");
		}

		const config = await getQueueConfig(queueChannel);

		// If the queue is open, display the user's limit usage
		const embed = new MessageEmbed() //
			.setTitle("Personal Statistics");

		const userIsBlacklisted = config.blacklistedUsers?.some(u => u.id === user.id) === true;
		if (userIsBlacklisted) {
			embed.addField("Blacklisted", ":skull_crossbones:");
		}

		const [latestSubmission, userSubmissionCount, avgDuration] = await Promise.all([
			fetchLatestEntryFrom(user.id, queueChannel),
			countAllEntriesFrom(user.id, queueChannel),
			averageSubmissionPlaytimeForUser(user.id, queueChannel)
		]);

		// Average song length
		if (avgDuration > 0) {
			const name = "Average Song Length";
			const value = createPartialString(durationString(avgDuration));
			if (config.entryDurationSeconds !== null && config.entryDurationSeconds > 0) {
				push(` (limit ${durationString(config.entryDurationSeconds)})`, value);
			}
			embed.addField(name, composed(value));
		}

		// Total submissions
		if (config.submissionMaxQuantity !== null && config.submissionMaxQuantity > 0) {
			const name = "Total Submissions";
			const value = `${userSubmissionCount} of ${config.submissionMaxQuantity}`;
			embed.addField(name, value);
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
			embed.addField(name, value);
		}

		if (embed.fields.length > 0) {
			await replyPrivately({ embeds: [embed] });
		} else {
			await replyPrivately("The queue is empty. You have no stats lol");
		}
	}
};
