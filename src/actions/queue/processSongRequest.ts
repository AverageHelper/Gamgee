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
import type { UnsentQueueEntry } from "../../queueStorage";

export interface SongAcceptance {
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
  logger.debug(`accepted urlRequest from message from ${message.author.id}: ${message.content}`);
  await Promise.all([
    queue.push(entry), //
    shouldSendUrl ? message.channel.send(entry.url) : null
  ]);
  logger.debug(
    `Pushed new entry to queue. Sending public acceptance to user ${logUser(message.author)}`
  );
  // Send acceptance after the potential `send(entry.url)` call
  await message.channel.send(`<@!${message.author.id}>, Submission Accepted!`);
  logger.debug("Responded.");
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
  logger.debug(
    `started processing urlRequest from message from ${message.author.id}: ${message.content}`
  );
  const senderId = message.author.id;
  const sentAt = message.createdAt;

  logger.debug(`Preparing queue cache for channel ${queueChannel.id} (#${queueChannel.name})`);
  const queue = await useQueue(queueChannel);
  logger.debug("Queue prepared!");

  try {
    const [config, latestSubmission, userSubmissionCount] = await Promise.all([
      queue.getConfig(),
      queue.getLatestEntryFrom(senderId),
      queue.countFrom(senderId) // TODO: countFromSince so we can reset the userSubmissionCount limit throughout the night
    ]);

    // ** If the user has used all their submissions, reject!
    const maxSubs = config.submissionMaxQuantity;
    logger.verbose(
      `User ${logUser(message.author)} has submitted ${userSubmissionCount} requests in total`
    );
    if (maxSubs !== null && maxSubs > 0 && userSubmissionCount >= maxSubs) {
      const rejectionBuilder = new StringBuilder();
      rejectionBuilder.push("You have used all ");
      rejectionBuilder.pushBold(`${maxSubs}`);
      rejectionBuilder.push(" of your allotted submissions.");
      return reject_private(message, rejectionBuilder.result());
    }

    // ** If the user is still under cooldown, reject!
    const cooldown = config.cooldownSeconds;
    const latestTimestamp = latestSubmission?.sentAt.getTime() ?? null;
    const timeSinceLatest =
      latestTimestamp !== null ? (Date.now() - latestTimestamp) / MILLISECONDS_IN_SECOND : null;
    logger.verbose(
      `User ${logUser(message.author)} last submitted a request ${
        timeSinceLatest ?? "<never>"
      } seconds ago`
    );
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
      logger.debug(
        `rejected urlRequest from message from ${message.author.id}: ${message.content}`
      );
      return reject_private(message, rejectionBuilder.result());
    }

    const song = await getVideoDetails(args);
    if (song === null) {
      return reject_public(
        message,
        "I can't find that song. ¯\\_(ツ)_/¯\nTry a YouTube, SoundCloud, or Bandcamp link."
      );
    }

    const url = song.url;
    const seconds = song.duration.seconds;

    // ** If the song is too long, reject!
    const maxDuration = config.entryDurationSeconds;
    if (maxDuration !== null && maxDuration > 0 && seconds > maxDuration) {
      const rejectionBuilder = new StringBuilder();
      rejectionBuilder.push("That song is too long. The limit is ");
      rejectionBuilder.pushBold(`${durationString(maxDuration)}`);
      return reject_public(message, rejectionBuilder.result());
    }

    // Whether We haven't had this link embedded yet
    const shouldSendUrl = !song.fromUrl;
    const entry = { url, seconds, sentAt, senderId };

    // ** Full send!
    // TODO: Add this to a process queue. Submissions should be accepted in the order they were received, though vetting can take place in parallel between users.
    return await acceptSongRequest({ queue, message, entry, shouldSendUrl, logger });

    // Handle fetch errors
  } catch (error: unknown) {
    logger.error(
      richErrorMessage(`Failed to run query: ${JSON.stringify(args, undefined, 2)}`, error)
    );
    return reject_public(message, "That query gave me an error.");
  }
}
