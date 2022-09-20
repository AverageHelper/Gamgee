import type Discord from "discord.js";
import type { CommandContext } from "../../commands/index.js";
import type { Logger } from "../../logger.js";
import type { UnsentQueueEntry } from "../../useQueueStorage.js";
import type { URL } from "node:url";
import { composed, createPartialString, push, pushNewLine } from "../../helpers/composeStrings.js";
import { deleteMessage } from "../../actions/messages/index.js";
import { durationString } from "../../helpers/durationString.js";
import { getVideoDetails } from "../getVideoDetails.js";
import { logUser } from "../../helpers/logUser.js";
import { MILLISECONDS_IN_SECOND, SECONDS_IN_MINUTE } from "../../constants/time.js";
import { playtimeTotalInQueue, pushEntryToQueue } from "./useQueue.js";
import { richErrorMessage } from "../../helpers/richErrorMessage.js";
import { isQueueOpen, setQueueOpen } from "../../useGuildStorage.js";
import { SHRUGGIE } from "../../constants/textResponses.js";
import { DEFAULT_LOCALE, t, ti } from "../../i18n.js";
import { useLogger } from "../../logger.js";
import {
	countAllStoredEntriesFromSender,
	getLatestStoredEntryFromSender,
	getStoredQueueConfig
} from "../../useQueueStorage.js";

export interface SongRequest {
	/** The URL where the track may be found. */
	songUrl: URL;

	/** The command context of the request. */
	context: CommandContext;

	/** The queue channel where the request should land if accepted. */
	queueChannel: Discord.TextChannel;

	/**
	 * The message that contains the original embed, if we sent
	 * one. If the user sent one, this value should be `null`.
	 */
	publicPreemptiveResponse: Discord.Message | null;

	/** The place where log messages should be sent. */
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
	await context.followUp({
		content: `${MENTION_SENDER}, ${t(
			"commands.sr.responses.submission-accepted",
			context.guildLocale
		)}`,
		reply: false
	});
	if (context.type === "interaction") {
		try {
			await context.interaction.editReply(t("commands.sr.responses.finished", context.userLocale));
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
	const userLocale = context.userLocale;
	const guildLocale = context.guildLocale;
	const sender = context.user;
	const senderId = sender.id;

	const songInfoPromise = getVideoDetails(songUrl); // start this and do other things

	try {
		const [config, latestSubmission, userSubmissionCount, playtimeTotal] = await Promise.all([
			getStoredQueueConfig(queueChannel),
			getLatestStoredEntryFromSender(senderId, queueChannel),
			countAllStoredEntriesFromSender(senderId, queueChannel),
			playtimeTotalInQueue(queueChannel)
		]);

		// ** If the user is blacklisted, reject!
		if (config.blacklistedUsers?.some(user => user.id === senderId) === true) {
			logger.verbose(
				`${config.blacklistedUsers.length} users on the blacklist. User ${logUser(
					sender
				)} is one of them.`
			);
			logger.verbose(`Rejected request from user ${logUser(sender)}.`);
			return await reject_private(request, t("commands.sr.responses.not-allowed", userLocale));
		}

		// ** If the user has used all their submissions, reject!
		const maxSubs = config.submissionMaxQuantity;
		logger.verbose(
			`User ${logUser(sender)} has submitted ${userSubmissionCount} request${
				userSubmissionCount === 1 ? "" : "s"
			} before this one`
		);
		if (maxSubs !== null && maxSubs > 0 && userSubmissionCount >= maxSubs) {
			const reason = ti(
				"commands.sr.responses.rejections.allotment-expended",
				{ max: `**${maxSubs}**` },
				userLocale
			);
			logger.verbose(`Rejected request from user ${logUser(sender)}.`);
			return await reject_private(request, reason);
		}

		// ** If the user is still under cooldown, reject!
		const cooldown = config.cooldownSeconds;
		const latestTimestamp = latestSubmission?.sentAt.getTime() ?? null;
		const timeSinceLatest =
			latestTimestamp !== null ? (Date.now() - latestTimestamp) / MILLISECONDS_IN_SECOND : null;
		if (timeSinceLatest === null) {
			logger.verbose(
				`This is the first song request that I've seen from user ${logUser(sender)} tonight.`
			);
		} else {
			logger.verbose(
				`User ${logUser(sender)} last submitted a request ${durationString(
					DEFAULT_LOCALE,
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
			const reason = ti(
				"commands.sr.responses.rejections.cooldown",
				{
					duration: durationString(userLocale, cooldown),
					remaining: `**${durationString(userLocale, cooldown - timeSinceLatest)}**`
				},
				userLocale
			);
			logger.verbose(`Rejected request from user ${logUser(sender)}.`);
			return await reject_private(request, reason);
		}

		// ** If, by the time we got here, the queue has closed, reject!
		const isOpen = await isQueueOpen(queueChannel.guild);
		if (!isOpen) {
			return await reject_private(request, t("common.queue.not-open", userLocale));
		}

		const song = await songInfoPromise; // we need this info now
		if (song === null) {
			logger.verbose("Could not find the requested song.");
			logger.verbose(`Rejected request from user ${logUser(sender)}.`);
			// FIXME: This response is too generic. Present something more actionable based on why the song can't be found
			return await reject_public(
				context,
				`${t("commands.sr.responses.song-not-found", guildLocale)} ${SHRUGGIE}\n${t(
					"commands.sr.responses.try-supported-platform",
					guildLocale
				)}`
			);
		}

		const url = song.url;
		const seconds = song.duration.seconds;
		logger.verbose(
			`User ${logUser(sender)} wants to submit a song that is ${durationString(
				DEFAULT_LOCALE,
				seconds
			)} long.`
		);

		// ** If the song is too short, reject!
		const minDuration = config.entryDurationMinSeconds;
		if (minDuration !== null && minDuration > 0 && seconds < minDuration) {
			const rejection = createPartialString(
				ti(
					"commands.sr.responses.rejections.too-short",
					{
						limit: `**${durationString(guildLocale, minDuration)}**`,
						actual: `**${durationString(guildLocale, seconds)}**`
					},
					guildLocale
				)
			);
			pushNewLine(rejection);
			push(t("commands.sr.responses.try-longer-song", guildLocale), rejection);
			logger.verbose(`Rejected request from user ${logUser(sender)}.`);
			return await reject_public(context, composed(rejection));
		}

		// ** If the song is too long, reject!
		const maxDuration = config.entryDurationMaxSeconds;
		if (maxDuration !== null && maxDuration > 0 && seconds > maxDuration) {
			const rejection = createPartialString(
				ti(
					"commands.sr.responses.rejections.too-long",
					{
						limit: `**${durationString(guildLocale, maxDuration)}**`,
						actual: `**${durationString(guildLocale, seconds)}**`
					},
					guildLocale
				)
			);
			pushNewLine(rejection);
			push(t("commands.sr.responses.try-shorter-song", guildLocale), rejection);
			logger.verbose(`Rejected request from user ${logUser(sender)}.`);
			return await reject_public(context, composed(rejection));
		}

		// ** If, by the time we got here, the queue has closed, reject!
		const isStillOpen = await isQueueOpen(queueChannel.guild);
		if (!isStillOpen) {
			return await reject_private(request, t("common.queue.not-open", userLocale));
		}

		{
			const durationBefore = durationString(DEFAULT_LOCALE, playtimeTotal, true);
			const durationAfter = durationString(DEFAULT_LOCALE, playtimeTotal + seconds, true);
			logger.info(`This submission would put the queue from ${durationBefore} to ${durationAfter}`);
		}

		const entry = { url, seconds, senderId };

		// ** Full send!
		await acceptSongRequest({ queueChannel, context, entry, logger });

		// ** Contingencies
		const totalPlaytimeLimit = config.queueDurationSeconds;
		const FOUR_MINUTES = 4 * SECONDS_IN_MINUTE;
		const buffer = 1.5 * (maxDuration ?? FOUR_MINUTES);

		// If the queue would be overfull with this submission, accept the submission then close the queue
		if (totalPlaytimeLimit !== null && playtimeTotal + seconds > totalPlaytimeLimit) {
			{
				const durationLimitMsg = durationString(DEFAULT_LOCALE, totalPlaytimeLimit, true);
				const durationMsg = durationString(DEFAULT_LOCALE, playtimeTotal + seconds, true);
				logger.info(
					`The queue's duration limit is ${durationLimitMsg}. We're at ${durationMsg}. Closing the queue.`
				);
			}

			// This code is mainly copied from the implementation of `/quo close`
			const promises: Array<Promise<unknown>> = [
				setQueueOpen(false, queueChannel.guild),
				queueChannel.send(
					`${t("commands.sr.responses.this-queue-full-autoclose", guildLocale)} :wave:`
				)
			];
			await Promise.all(promises);
			await context.followUp({
				content: `\\~\\~\\~\\~\\~\\~\\~\\~\n\n**${t(
					"commands.sr.responses.queue-full-autoclose",
					guildLocale
				)}**  :wave:\n\n\\~\\~\\~\\~\\~\\~\\~\\~`,
				reply: false
			});

			// If the queue will fill up soon, give warning, where
			// "soon" ~= 1.5 times the upper entry duration limit,
			// or 6m if no such limit is set
		} else if (
			totalPlaytimeLimit !== null &&
			playtimeTotal + seconds + buffer > totalPlaytimeLimit
		) {
			{
				const durationLimitMsg = durationString(DEFAULT_LOCALE, totalPlaytimeLimit, true);
				const durationMsg = durationString(DEFAULT_LOCALE, playtimeTotal + seconds, true);
				logger.info(
					`The queue's duration limit is ${durationLimitMsg}. We're at ${durationMsg}. Closing the queue soon.`
				);
			}

			await context.followUp({
				content: `========\n\n**${t(
					"commands.sr.responses.queue-nearly-full",
					guildLocale
				)}**  :checkered_flag:\n\n========`,
				reply: false
			});
		}

		// Handle fetch errors
	} catch (error) {
		logger.error(richErrorMessage("Failed to process song request", error));
		return await reject_public(
			context,
			`${t("commands.sr.responses.query-returned-error", guildLocale)} :shrug:`
		);
	}
}
