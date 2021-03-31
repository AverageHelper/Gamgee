import type { ArbitrarySubcommand } from "../Command";
import { MILLISECONDS_IN_SECOND } from "../../constants/time";
import { useLogger } from "../../logger";
import { useQueue, UnsentQueueEntry } from "../../actions/queue/useQueue";
import { reject_public, reject_private } from "./actions";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import getVideoDetails from "../../actions/getVideoDetails";
import durationString from "../../helpers/durationString";
import StringBuilder from "../../helpers/StringBuilder";
import richErrorMessage from "../../helpers/richErrorMessage";
import { deleteMessage } from "../../actions/messages/deleteMessage";
import { useGuildStorage } from "../../useGuildStorage";
import logUser from "../../helpers/logUser";

const logger = useLogger();

const urlRequest: ArbitrarySubcommand = {
  format: "<YouTube, SoundCloud, or Bandcamp link>",
  description: "Attempts to add the given content to the queue.",
  async execute({ args, message }): Promise<void> {
    if (!message.guild) {
      return;
    }

    const guild = await useGuildStorage(message.guild);
    const queueChannel = await getQueueChannel(message);
    if (!queueChannel) {
      return reject_public(message, "No queue is set up.");
    }

    if (message.channel.id === queueChannel?.id) {
      await Promise.all([
        deleteMessage(message, "Spam; song requests are not permitted in the queue channel."),
        reject_private(
          message,
          "Requesting songs in the queue channel has not been implemented yet."
        )
      ]);
      return;
    }

    const isQueueOpen = await guild.getQueueOpen();
    if (!isQueueOpen) {
      return reject_public(message, "The queue is not open.");
    }

    logger.debug(`Preparing queue cache for channel ${queueChannel.id} (#${queueChannel.name})`);
    const queue = await useQueue(queueChannel);
    logger.debug("Queue prepared!");

    async function accept(entry: UnsentQueueEntry, sendUrl = false): Promise<void> {
      await Promise.all([
        queue.push(entry), //
        sendUrl ? message.channel.send(entry.url) : null
      ]);
      logger.debug(
        `Pushed new entry to queue. Sending public acceptance to user ${logUser(message.author)}`
      );
      // Send acceptance after the potential `send(entry.url)` call
      await message.channel.send(`<@!${message.author.id}>, Submission Accepted!`);
      logger.debug("Responded.");
    }

    const sentAt = message.createdAt;
    const senderId = message.author.id;

    try {
      const [config, latestSubmission, userSubmissionCount] = await Promise.all([
        queue.getConfig(),
        queue.getLatestEntryFrom(senderId),
        queue.countFrom(senderId) // TODO: countFromSince so we can reset the userSubmissionCount limit throughout the night
      ]);

      // If the user has used all their submissions, reject!
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

      // If the user is still under cooldown, reject!
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
        return reject_private(message, rejectionBuilder.result());
      }

      const song = await getVideoDetails(args);
      if (song === null) {
        return reject_public(
          message,
          "I can't find that song. ¯\\_(ツ)_/¯\nTry a YouTube or SoundCloud link instead."
        );
      }

      const url = song.url;
      const seconds = song.duration.seconds;

      // If the song is too long, reject!
      const maxDuration = config.entryDurationSeconds;
      if (maxDuration !== null && maxDuration > 0 && seconds > maxDuration) {
        const rejectionBuilder = new StringBuilder();
        rejectionBuilder.push("That song is too long. The limit is ");
        rejectionBuilder.pushBold(`${durationString(maxDuration)}`);
        return reject_public(message, rejectionBuilder.result());
      }

      // Whether We haven't had this link embedded yet
      const shouldSendUrl = !song.fromUrl;

      // Full send!
      return accept({ url, seconds, sentAt, senderId }, shouldSendUrl);

      // Handle fetch errors
    } catch (error: unknown) {
      logger.error(
        richErrorMessage(`Failed to run query: ${JSON.stringify(args, undefined, 2)}`, error)
      );
      return reject_public(message, "That query gave me an error.");
    }
  }
};

export default urlRequest;
