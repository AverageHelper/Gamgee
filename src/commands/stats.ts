import type { Command } from "./Command.js";
import { composed, createPartialString, push } from "../helpers/composeStrings.js";
import { durationString } from "../helpers/durationString.js";
import { EmbedBuilder } from "discord.js";
import { getQueueChannel } from "../actions/queue/getQueueChannel.js";
import { isQueueOpen } from "../useGuildStorage.js";
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
	async execute({ user, guild, replyPrivately, deleteInvocation }) {
		await deleteInvocation();

		const [queueChannel, isOpen] = await Promise.all([
			getQueueChannel(guild), //
			isQueueOpen(guild)
		]);
		if (!queueChannel) {
			return await replyPrivately("No queue is set up.");
		}

		const config = await getQueueConfig(queueChannel);

		// If the queue is open, display the user's limit usage
		const embed = new EmbedBuilder() //
			.setTitle("Personal Statistics");

		const userIsBlacklisted = config.blacklistedUsers?.some(u => u.id === user.id) === true;
		if (userIsBlacklisted) {
			embed.addFields({ name: "Blacklisted", value: ":skull_crossbones:" });
		}

		const [latestSubmission, userSubmissionCount, avgDuration] = await Promise.all([
			fetchLatestEntryFrom(user.id, queueChannel),
			countAllEntriesFrom(user.id, queueChannel),
			averageSubmissionPlaytimeForUser(user.id, queueChannel)
		]);

		// Average song length
		const durationMsg = createPartialString(durationString(avgDuration));
		if (config.entryDurationSeconds !== null && config.entryDurationSeconds > 0) {
			push(` (limit ${durationString(config.entryDurationSeconds)})`, durationMsg);
		}
		embed.addFields({ name: "Average Length of Your Submissions", value: composed(durationMsg) });

		// Total submissions
		const requestCountMsg = createPartialString(`${userSubmissionCount}`);
		if (config.submissionMaxQuantity !== null && config.submissionMaxQuantity > 0) {
			push(` (limit ${config.submissionMaxQuantity})`, requestCountMsg);
		}
		embed.addFields({ name: "Total Submissions from You", value: composed(requestCountMsg) });

		// Remaining wait time (if applicable)
		const userCanSubmitAgainLater =
			config.submissionMaxQuantity === null ||
			(config.submissionMaxQuantity > 0 && userSubmissionCount < config.submissionMaxQuantity);

		if (userCanSubmitAgainLater && isOpen) {
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
			const value = durationString(timeToWait);
			embed.addFields({ name: "Time Remaining on Cooldown", value });

			// TODO: ETA to user's next submission would be nice here
		}

		if ((embed.data.fields ?? []).length > 0) {
			await replyPrivately({ embeds: [embed] });
		} else {
			await replyPrivately("The queue is empty. You have no stats lol");
		}
	}
};
