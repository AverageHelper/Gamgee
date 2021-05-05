import type Discord from "discord.js";
import type { Logger } from "../../logger";
import { MILLISECONDS_IN_SECOND } from "../../constants/time";
import type { QueueManager } from "./useQueue";
import { useQueue } from "./useQueue";
import { reject_public, reject_private } from "../../commands/songRequest/actions";
import getVideoDetails from "../getVideoDetails";
import durationString from "../../helpers/durationString";
import StringBuilder from "../../helpers/StringBuilder";
import richErrorMessage from "../../helpers/richErrorMessage";
import logUser from "../../helpers/logUser";
import type { UnsentQueueEntry } from "../../useQueueStorage";

interface SongAcceptance {
  queue: QueueManager;
  message: Discord.Message;
  entry: UnsentQueueEntry;
  shouldSendUrl: boolean;
  logger: Logger;
}

/**
 * Adds an entry to the song queue, and sends appropriate feedback responses.
 *
 * @param param0 The feedback context.
 */
async function acceptSongRequest({
  queue,
  message,
  entry,
  shouldSendUrl,
  logger
}: SongAcceptance): Promise<void> {
  await Promise.all([
    queue.push(entry), //
    shouldSendUrl ? message.channel.send(entry.url) : null
  ]);
  logger.verbose(`Accepted request from user ${logUser(message.author)}.`);
  logger.debug(
    `Pushed new request to queue. Sending public acceptance to user ${logUser(message.author)}`
  );
  // Send acceptance after the potential `send(entry.url)` call
  await message.channel.send(`<@!${message.author.id}>, Submission Accepted!`);
}

export interface SongRequest {
  requestArgs: Array<string>;
  message: Discord.Message;
  queueChannel: Discord.TextChannel;
  logger: Logger;
}

/**
 * Processes a song request, either accepting or rejecting the request, and possibly
 * adding the song to the queue.
 *
 * @param param0 The song request context.
 */
export default async function processSongRequest({
  requestArgs: args,
  message,
  queueChannel,
  logger
}: SongRequest): Promise<void> {
  const senderId = message.author.id;
  const sentAt = message.createdAt;

  const queue = useQueue(queueChannel);

  try {
    const [config, latestSubmission, userSubmissionCount] = await Promise.all([
      queue.getConfig(),
      queue.getLatestEntryFrom(senderId),
      queue.countFrom(senderId /* since: Date */)
    ]);

    // ** If the user is blacklisted, reject!
    if (config.blacklistedUsers.some(user => user.id === message.author.id)) {
      logger.verbose(
        `${config.blacklistedUsers.length} users on the blacklist. User ${logUser(
          message.author
        )} is one of them.`
      );
      logger.verbose(`Rejected request from user ${logUser(message.author)}.`);
      return reject_private(message, "You're not allowed to submit songs. My apologies.");
    }

    // ** If the user has used all their submissions, reject!
    const maxSubs = config.submissionMaxQuantity;
    logger.verbose(
      `User ${logUser(message.author)} has submitted ${userSubmissionCount} request${
        userSubmissionCount === 1 ? "" : "s"
      } before this one`
    );
    if (maxSubs !== null && maxSubs > 0 && userSubmissionCount >= maxSubs) {
      const rejectionBuilder = new StringBuilder();
      rejectionBuilder.push("You have used all ");
      rejectionBuilder.pushBold(`${maxSubs}`);
      rejectionBuilder.push(" of your allotted submissions.");
      logger.verbose(`Rejected request from user ${logUser(message.author)}.`);
      return reject_private(message, rejectionBuilder.result());
    }

    // ** If the user is still under cooldown, reject!
    const cooldown = config.cooldownSeconds;
    const latestTimestamp = latestSubmission?.sentAt.getTime() ?? null;
    const timeSinceLatest =
      latestTimestamp !== null ? (Date.now() - latestTimestamp) / MILLISECONDS_IN_SECOND : null;
    if (timeSinceLatest === null) {
      logger.verbose(
        `This is the first song request that I've seen from user ${logUser(
          message.author
        )} tonight.`
      );
    } else {
      logger.verbose(
        `User ${logUser(message.author)} last submitted a request ${durationString(
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
      const rejectionBuilder = new StringBuilder();
      rejectionBuilder.push("You must wait ");
      rejectionBuilder.pushBold(durationString(cooldown - timeSinceLatest));
      rejectionBuilder.push(" before submitting again.");
      logger.verbose(`Rejected request from user ${logUser(message.author)}.`);
      return reject_private(message, rejectionBuilder.result());
    }

    const song = await getVideoDetails(args);
    if (song === null) {
      logger.verbose("Could not find the requested song.");
      logger.verbose(`Rejected request from user ${logUser(message.author)}.`);
      return reject_public(
        message,
        "I can't find that song. ¯\\_(ツ)_/¯\nTry a YouTube, SoundCloud, or Bandcamp link."
      );
    }

    const url = song.url;
    const seconds = song.duration.seconds;

    // ** If the song is too long, reject!
    const maxDuration = config.entryDurationSeconds;
    logger.verbose(
      `User ${logUser(message.author)} wants to submit a song that is ${durationString(
        seconds
      )} long.`
    );
    if (maxDuration !== null && maxDuration > 0 && seconds > maxDuration) {
      const rejectionBuilder = new StringBuilder();
      rejectionBuilder.push("That song is too long. The limit is ");
      rejectionBuilder.pushBold(`${durationString(maxDuration)}`);
      logger.verbose(`Rejected request from user ${logUser(message.author)}.`);
      return reject_public(message, rejectionBuilder.result());
    }

    // Whether We haven't had this link embedded yet
    const shouldSendUrl = !song.fromUrl;
    const entry = { url, seconds, sentAt, senderId };

    // ** Full send!
    return await acceptSongRequest({ queue, message, entry, shouldSendUrl, logger });

    // Handle fetch errors
  } catch (error: unknown) {
    logger.error(richErrorMessage("Failed to process song request", error));
    return reject_public(message, "That query gave me an error. Try again maybe? :shrug:");
  }
}
