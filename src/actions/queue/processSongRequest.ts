import type Discord from "discord.js";
import type { CommandContext } from "../../commands/index.js";
import type { Logger } from "../../logger.js";
import type { UnsentQueueEntry } from "../../useQueueStorage.js";
import type { URL } from "url";
import { deleteMessage } from "../../actions/messages/index.js";
import { durationString } from "../../helpers/durationString.js";
import { getVideoDetails } from "../getVideoDetails.js";
import { logUser } from "../../helpers/logUser.js";
import { MILLISECONDS_IN_SECOND } from "../../constants/time.js";
import { playtimeTotalInQueue, pushEntryToQueue } from "./useQueue.js";
import { richErrorMessage } from "../../helpers/richErrorMessage.js";
import { setQueueOpen } from "../../useGuildStorage.js";
import { SHRUGGIE } from "../../constants/textResponses.js";
import { useLogger } from "../../logger.js";
import {
	countAllEntriesFrom,
	fetchLatestEntryFrom,
	getQueueConfig
} from "../../useQueueStorage.js";
import {
	composed,
	createPartialString,
	push,
	pushBold,
	pushNewLine
} from "../../helpers/composeStrings.js";

export interface SongRequest {
	songUrl: URL;
	context: CommandContext;
	queueChannel: Discord.TextChannel;
	publicPreemptiveResponse: Discord.Message | null;
	logger: Logger;
}

const logger = useLogger();

async function reject_private(request: SongRequest, reason: string): Promise<void> {
	const context = request.context;
	const content = `:hammer: <@!${context.user.id}> ${reason}`;

	if (context.type === "interaction") {
		if (request.publicPreemptiveResponse) {
			// delete the mock invocation
			await deleteMessage(request.publicPreemptiveResponse);
		}
		try {
			await context.interaction.editReply({
				content,
				allowedMentions: { users: [context.user.id], repliedUser: true }
			});
		} catch (error) {
			logger.error(error);
		}
	} else {
		await context.deleteInvocation();
		await context.replyPrivately(content);
	}
}

async function reject_public(context: CommandContext, reason: string): Promise<void> {
	await context.followUp({ content: `:hammer: <@!${context.user.id}> ${reason}`, reply: false });
	if (context.type === "message") {
		// Can't suppress other users' embeds, but we *can* delete the message
		await deleteMessage(context.message);
	} else {
		try {
			await context.interaction.editReply("Done.");
		} catch (error) {
			logger.error(error);
		}
	}
}

interface SongAcceptance {
	queueChannel: Discord.TextChannel;
	context: CommandContext;
	entry: UnsentQueueEntry;
	logger: Logger;
}

/**
 * Adds an entry to the song queue, and sends appropriate feedback responses.
 *
 * @param param0 The feedback context.
 */
async function acceptSongRequest({
	queueChannel,
	context,
	entry,
	logger
}: SongAcceptance): Promise<void> {
	await pushEntryToQueue(entry, queueChannel);
	logger.verbose(`Accepted request from user ${logUser(context.user)}.`);
	logger.debug(
		`Pushed new request to queue. Sending public acceptance to user ${logUser(context.user)}`
	);

	const MENTION_SENDER = `<@!${context.user.id}>`;
	await context.followUp({ content: `${MENTION_SENDER}, Submission Accepted!`, reply: false });
	if (context.type === "interaction") {
		try {
			await context.interaction.editReply("Done.");
		} catch (error) {
			logger.error(error);
		}
	}
}

/**
 * Processes a song request, either accepting or rejecting the request, and possibly
 * adding the song to the queue.
 *
 * @param request The song request context.
 */
export async function processSongRequest(request: SongRequest): Promise<void> {
	const { songUrl, context, queueChannel, logger } = request;
	const senderId = context.user.id;

	const songInfoPromise = getVideoDetails(songUrl); // start this and do other things

	try {
		const [config, latestSubmission, userSubmissionCount, playtimeTotal] = await Promise.all([
			getQueueConfig(queueChannel),
			fetchLatestEntryFrom(senderId, queueChannel),
			countAllEntriesFrom(senderId, queueChannel),
			playtimeTotalInQueue(queueChannel)
		]);

		// ** If the user is blacklisted, reject!
		if (config.blacklistedUsers?.some(user => user.id === context.user.id) === true) {
			logger.verbose(
				`${config.blacklistedUsers.length} users on the blacklist. User ${logUser(
					context.user
				)} is one of them.`
			);
			logger.verbose(`Rejected request from user ${logUser(context.user)}.`);
			return reject_private(request, "You're not allowed to submit songs. My apologies.");
		}

		// ** If the user has used all their submissions, reject!
		const maxSubs = config.submissionMaxQuantity;
		logger.verbose(
			`User ${logUser(context.user)} has submitted ${userSubmissionCount} request${
				userSubmissionCount === 1 ? "" : "s"
			} before this one`
		);
		if (maxSubs !== null && maxSubs > 0 && userSubmissionCount >= maxSubs) {
			const rejection = createPartialString();
			push("You have used all ", rejection);
			pushBold(`${maxSubs}`, rejection);
			push(" of your allotted submissions.", rejection);
			logger.verbose(`Rejected request from user ${logUser(context.user)}.`);
			return reject_private(request, composed(rejection));
		}

		// ** If the user is still under cooldown, reject!
		const cooldown = config.cooldownSeconds;
		const latestTimestamp = latestSubmission?.sentAt.getTime() ?? null;
		const timeSinceLatest =
			latestTimestamp !== null ? (Date.now() - latestTimestamp) / MILLISECONDS_IN_SECOND : null;
		if (timeSinceLatest === null) {
			logger.verbose(
				`This is the first song request that I've seen from user ${logUser(context.user)} tonight.`
			);
		} else {
			logger.verbose(
				`User ${logUser(context.user)} last submitted a request ${durationString(
					timeSinceLatest
				)} ago.`
			);
		}
		if (
			cooldown !== null &&
			cooldown > 0 &&
			timeSinceLatest !== null &&
			cooldown > timeSinceLatest
		) {
			const rejection = createPartialString();
			push("You've already submitted a song within the last ", rejection);
			push(durationString(cooldown), rejection);
			push(". You must wait ", rejection);
			pushBold(durationString(cooldown - timeSinceLatest), rejection);
			push(" before submitting again.", rejection);
			logger.verbose(`Rejected request from user ${logUser(context.user)}.`);
			return reject_private(request, composed(rejection));
		}

		const song = await songInfoPromise; // we need this info now
		if (song === null) {
			logger.verbose("Could not find the requested song.");
			logger.verbose(`Rejected request from user ${logUser(context.user)}.`);
			// FIXME: This response is too generic. Present something more actionable based on why the song can't be found
			return reject_public(
				context,
				`I can't find that song. ${SHRUGGIE}\nTry a link from a supported platform.`
			);
		}

		const url = song.url;
		const seconds = song.duration.seconds;

		// ** If the song is too long, reject!
		const maxDuration = config.entryDurationSeconds;
		logger.verbose(
			`User ${logUser(context.user)} wants to submit a song that is ${durationString(
				seconds
			)} long.`
		);
		if (maxDuration !== null && maxDuration > 0 && seconds > maxDuration) {
			const rejection = createPartialString();
			push("That song is too long. The limit is ", rejection);
			pushBold(durationString(maxDuration), rejection);
			push(", but this is ", rejection);
			pushBold(durationString(seconds), rejection);
			push(" long.", rejection);
			pushNewLine(rejection);
			push("Try something a bit shorter", rejection);
			logger.verbose(`Rejected request from user ${logUser(context.user)}.`);
			return reject_public(context, composed(rejection));
		}

		const durationBefore = durationString(playtimeTotal, true);
		const durationAfter = durationString(playtimeTotal + seconds, true);
		logger.info(`This submission would put the queue from ${durationBefore} to ${durationAfter}`);

		const entry = { url, seconds, senderId };

		// ** Full send!
		await acceptSongRequest({ queueChannel, context, entry, logger });

		// ** If the queue would be overfull with this submission, accept the submission then close the queue
		const totalPlaytimeLimit = config.queueDurationSeconds;
		if (totalPlaytimeLimit !== null && playtimeTotal + seconds > totalPlaytimeLimit) {
			const durationLimitMsg = durationString(totalPlaytimeLimit, true);
			logger.info(`The queue's duration limit is ${durationLimitMsg}. Closing the queue.`);

			// This code is mainly copied from the implementation of `/quo close`
			const queueIsCurrent = context.channel?.id === queueChannel.id;
			const promises: Array<Promise<unknown>> = [setQueueOpen(false, queueChannel.guild)];
			if (!queueIsCurrent) {
				// Post in the queue channel if this command wasn't run from there
				promises.push(queueChannel.send("This queue is full. I'm closing it now. :wave:"));
			}
			await Promise.all(promises);
			await context.followUp({
				content: "The queue is full. I'm closing it now. :wave:",
				reply: false
			});
		}

		// Handle fetch errors
	} catch (error) {
		logger.error(richErrorMessage("Failed to process song request", error));
		return reject_public(context, "That query gave me an error. Try again maybe? :shrug:");
	}
}
