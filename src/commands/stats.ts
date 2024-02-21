import type { Command } from "./Command.js";
import { averageSubmissionPlaytimeForUser } from "../actions/queue/useQueue.js";
import { durationString } from "../helpers/durationString.js";
import { EmbedBuilder } from "discord.js";
import { getQueueChannel } from "../actions/queue/getQueueChannel.js";
import { isQueueOpen } from "../useGuildStorage.js";
import { localizations, t, ti } from "../i18n.js";
import { MILLISECONDS_IN_SECOND } from "../constants/time.js";
import {
	countAllStoredEntriesFromSender,
	getLatestStoredEntryFromSender,
	getStoredQueueConfig,
} from "../useQueueStorage.js";

export const stats: Command = {
	name: "stats",
	nameLocalizations: localizations("commands.stats.name"),
	description: "Get your personal queue statistics.",
	descriptionLocalizations: localizations("commands.stats.description"),
	requiresGuild: true,
	async execute({ user, userLocale, guild, replyPrivately, deleteInvocation }) {
		await deleteInvocation();

		const [queueChannel, isOpen] = await Promise.all([
			getQueueChannel(guild), //
			isQueueOpen(guild),
		]);
		if (!queueChannel) {
			return await replyPrivately(t("common.queue.not-set-up", userLocale));
		}

		const config = await getStoredQueueConfig(queueChannel);

		// If the queue is open, display the user's limit usage
		const embed = new EmbedBuilder() //
			.setTitle(t("commands.stats.responses.title", userLocale));

		const userIsBlacklisted = config.blacklistedUsers?.some(u => u.id === user.id) === true;
		if (userIsBlacklisted) {
			embed.addFields({
				name: t("commands.stats.responses.blacklisted", userLocale),
				value: ":skull_crossbones:",
			});
		}

		const [latestSubmission, userSubmissionCount, avgDuration] = await Promise.all([
			getLatestStoredEntryFromSender(user.id, queueChannel),
			countAllStoredEntriesFromSender(user.id, queueChannel),
			averageSubmissionPlaytimeForUser(user.id, queueChannel),
		]);

		// Average song length
		let durationMsg = durationString(userLocale, avgDuration);
		if (config.entryDurationMaxSeconds !== null && config.entryDurationMaxSeconds > 0) {
			durationMsg = ti(
				"commands.stats.responses.value-limit",
				{
					value: durationString(userLocale, avgDuration),
					limit: durationString(userLocale, config.entryDurationMaxSeconds),
				},
				userLocale,
			);
		}
		embed.addFields({
			name: t("commands.stats.responses.average-sub-duration", userLocale),
			value: durationMsg,
		});

		// Total submissions
		let requestCountMsg = `${userSubmissionCount}`;
		if (config.submissionMaxQuantity !== null && config.submissionMaxQuantity > 0) {
			requestCountMsg = ti(
				"commands.stats.responses.value-limit",
				{
					value: `${userSubmissionCount}`,
					limit: `${config.submissionMaxQuantity}`,
				},
				userLocale,
			);
		}
		embed.addFields({
			name: t("commands.stats.responses.total-subs", userLocale),
			value: requestCountMsg,
		});

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
			const value = durationString(userLocale, timeToWait);
			embed.addFields({
				name: t("commands.stats.responses.cooldown-remaining", userLocale),
				value,
			});

			// TODO: ETA to user's next submission would be nice here
		}

		if ((embed.data.fields ?? []).length > 0) {
			await replyPrivately({ embeds: [embed] });
		} else {
			await replyPrivately(t("commands.stats.responses.queue-empty", userLocale));
		}
	},
};
