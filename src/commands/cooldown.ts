import type { Command } from "./Command.js";
import { bold } from "../helpers/composeStrings.js";
import { durationString } from "../helpers/durationString.js";
import { getQueueChannel } from "../actions/queue/getQueueChannel.js";
import { isQueueOpen } from "../useGuildStorage.js";
import { localizations, t, ti } from "../i18n.js";
import { MILLISECONDS_IN_SECOND } from "../constants/time.js";
import {
	countAllStoredEntriesFromSender,
	getLatestStoredEntryFromSender,
	getStoredQueueConfig,
} from "../useQueueStorage.js";

export const cooldown: Command = {
	name: "cooldown",
	nameLocalizations: localizations("commands.cooldown.name"),
	description: "Find out when you can submit again.",
	descriptionLocalizations: localizations("commands.cooldown.description"),
	requiresGuild: true,
	async execute({ user, userLocale, guild, replyPrivately, deleteInvocation }) {
		await deleteInvocation();

		const [queueChannel, isOpen] = await Promise.all([
			getQueueChannel(guild), //
			isQueueOpen(guild),
		]);

		if (!queueChannel) return await replyPrivately(t("common.queue.not-set-up", userLocale));
		if (!isOpen) return await replyPrivately(t("common.queue.not-open", userLocale));

		const config = await getStoredQueueConfig(queueChannel);

		// If the user is blacklisted, they have no limit usage :P
		if (config.blacklistedUsers?.some(u => u.id === user.id) === true) {
			return await replyPrivately(t("commands.cooldown.responses.blacklisted", userLocale));
		}

		// If there's no cooldown, the user may submit whenever!
		const msgSubmitImmediately = `${t(
			"commands.cooldown.responses.immediately",
			userLocale,
		)} :grinning:`;
		if (config.cooldownSeconds === null || config.cooldownSeconds <= 0) {
			return await replyPrivately(msgSubmitImmediately);
		}

		// If the queue is open, display the user's limit usage
		const [latestSubmission, userSubmissionCount] = await Promise.all([
			getLatestStoredEntryFromSender(user.id, queueChannel),
			countAllStoredEntriesFromSender(user.id, queueChannel),
		]);

		if (!latestSubmission) {
			return await replyPrivately(msgSubmitImmediately);
		}

		const userCanSubmitAgainLater =
			config.submissionMaxQuantity === null ||
			(config.submissionMaxQuantity > 0 && userSubmissionCount < config.submissionMaxQuantity);

		if (userCanSubmitAgainLater) {
			// There's still time!
			const latestTimestamp = latestSubmission.sentAt.getTime();
			const timeSinceLatest = (Date.now() - latestTimestamp) / MILLISECONDS_IN_SECOND;
			const timeToWait = Math.max(0, config.cooldownSeconds - timeSinceLatest);

			if (timeToWait <= 0) {
				return await replyPrivately(msgSubmitImmediately);
			}

			const absolute = Math.ceil(latestTimestamp / MILLISECONDS_IN_SECOND + config.cooldownSeconds);
			const relative = durationString(userLocale, timeToWait);

			const msg = ti(
				"commands.cooldown.responses.later",
				{ relative: bold(relative), absolute: `<t:${absolute}:T>` },
				userLocale,
			);
			await replyPrivately(msg);
		} else {
			// We're finished, it is done, used all their submissions up
			let msg: string;
			if (userSubmissionCount <= 0) {
				msg = t("commands.cooldown.responses.submissions-all-exhausted", userLocale);
			} else if (userSubmissionCount === 1) {
				msg = t("commands.cooldown.responses.submissions-1-exhausted", userLocale);
			} else if (userSubmissionCount === 2) {
				msg = t("commands.cooldown.responses.submissions-2-exhausted", userLocale);
			} else {
				msg = ti(
					"commands.cooldown.responses.submissions-all-ct-exhausted",
					{ count: `${userSubmissionCount}` },
					userLocale,
				);
			}

			await replyPrivately(`${msg} :tada:`);
		}
	},
};
