import type { Command } from "./Command.js";
import { composed, createPartialString, push, pushBold } from "../helpers/composeStrings.js";
import { countAllEntriesFrom, fetchLatestEntryFrom, getQueueConfig } from "../useQueueStorage.js";
import { durationString } from "../helpers/durationString.js";
import { getQueueChannel } from "../actions/queue/getQueueChannel.js";
import { isQueueOpen } from "../useGuildStorage.js";
import { localizations } from "../i18n.js";
import { MILLISECONDS_IN_SECOND } from "../constants/time.js";

export const cooldown: Command = {
	name: "cooldown",
	nameLocalizations: localizations("commands.cooldown.name"),
	description: "Find out when you can submit again.",
	descriptionLocalizations: localizations("commands.cooldown.description"),
	requiresGuild: true,
	async execute({ user, guild, replyPrivately, deleteInvocation }) {
		await deleteInvocation();

		const [queueChannel, isOpen] = await Promise.all([
			getQueueChannel(guild), //
			isQueueOpen(guild)
		]);

		if (!queueChannel) return await replyPrivately("No queue is set up.");
		if (!isOpen) return await replyPrivately("The queue is not open.");

		const config = await getQueueConfig(queueChannel);

		// If the user is blacklisted, they have no limit usage :P
		if (config.blacklistedUsers?.some(u => u.id === user.id) === true) {
			return await replyPrivately("You can submit once you're removed from the blacklist... sorry");
		}

		// If there's no cooldown, the user may submit whenever!
		const msgSubmitImmediately = "You can submit right now! :grinning:";
		if (config.cooldownSeconds === null || config.cooldownSeconds <= 0) {
			return await replyPrivately(msgSubmitImmediately);
		}

		// If the queue is open, display the user's limit usage
		const [latestSubmission, userSubmissionCount] = await Promise.all([
			fetchLatestEntryFrom(user.id, queueChannel),
			countAllEntriesFrom(user.id, queueChannel)
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

			const absolute = Math.round(
				latestTimestamp / MILLISECONDS_IN_SECOND + config.cooldownSeconds
			);
			const relative = durationString(timeToWait);

			const msg = createPartialString("You may submit in ");
			pushBold(relative, msg);
			push(`, at <t:${absolute}:T> local time`, msg);
			await replyPrivately(composed(msg));
		} else {
			// We're finished, it is done, used all their submissions up
			const partial = createPartialString("You've used ");
			if (userSubmissionCount <= 0) {
				push("all of your submissions", partial);
			} else if (userSubmissionCount === 1) {
				push("your only submission", partial);
			} else if (userSubmissionCount === 2) {
				push("both of your submissions", partial);
			} else {
				push(`all ${userSubmissionCount} of your submissions`, partial);
			}
			push(" for the night! :tada:", partial);

			const msg = composed(partial);
			await replyPrivately(msg);
		}
	}
};
