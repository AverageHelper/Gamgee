import { useQueue, UnsentQueueEntry } from "../actions/queue/useQueue";
import type { Command } from "./index";
import { useLogger } from "../logger";
import getVideoDetails from "../actions/getVideoDetails";
import getQueueChannel from "../actions/queue/getQueueChannel";
import durationString from "../helpers/durationString";
import StringBuilder from "../helpers/StringBuilder";
import { MILLISECONDS_IN_SECOND } from "../constants/time";

const logger = useLogger();

const name = "sr";

const sr: Command = {
  name,
  description: "Submit a song to the queue.",
  uses: [
    [`${name} <song name or YouTube link>`, "Attempts to add the given content to the queue."]
  ],
  async execute(context) {
    const { message, args } = context;

    async function deleteMessage(reason: string) {
      await message
        .delete({ reason })
        .catch(error =>
          logger.error(
            `I don't seem to have permission to delete messages: ${JSON.stringify(
              error,
              undefined,
              2
            )}`
          )
        );
    }
    async function reject_private(reason: string) {
      await Promise.all([
        deleteMessage("Spam; this song request was rejected."),
        message.author.send(`(From <#${message.channel.id}>) ${reason}`)
      ]);
    }
    async function reject_public(reason: string) {
      await Promise.all([
        message.channel.send(`:hammer: <@!${message.author.id}> ${reason}`),
        message.suppressEmbeds(true)
      ]);
    }

    const queueChannel = await getQueueChannel(context);
    if (!queueChannel) {
      return reject_public("The queue is not open.");
    }

    if (message.channel.id === queueChannel.id) {
      // TODO: Add the ability to configure a specific channel from which song requests should be taken.
      await Promise.all([
        deleteMessage("Spam; song requests are not permitted in the queue channel."),
        reject_private("Requesting songs in the queue channel has not been implemented yet.")
      ]);
      return;
    }

    logger.debug(`Preparing queue cache for channel ${queueChannel.id} (#${queueChannel.name})`);
    const queue = await useQueue(queueChannel);
    logger.debug("Queue prepared!");

    if (args.length < 1) {
      return reject_public("You're gonna have to add a song link or title to that.");
    }

    async function accept(entry: UnsentQueueEntry, sendUrl = false) {
      await Promise.all([
        queue.push(entry), //
        sendUrl ? message.channel.send(entry.url) : null
      ]);
      logger.debug(
        `Pushed new entry to queue. Sending public acceptance to user ${message.author.id} (${message.author.username})`
      );
      // Send acceptance after the potential `send(entry.url)` call
      await message.channel.send(`**${message.author.username}**, Submission Accepted!`);
      logger.debug("Responded.");
    }

    try {
      const song = await getVideoDetails(args);
      if (song === null) {
        return reject_public(
          "I can't find that song. ¯\\_(ツ)_/¯\nTry a YouTube or SoundCloud link instead."
        );
      }

      const url = song.url;
      const seconds = song.duration.seconds;
      const sentAt = message.createdAt;
      const senderId = message.author.id;

      const [config, latestSubmission] = await Promise.all([
        queue.getConfig(),
        queue.getLatestEntryFrom(senderId)
      ]);

      // If the user is still under cooldown. reject!
      const cooldown = config.cooldownSeconds;
      const latestTimestamp = latestSubmission?.sentAt.getTime() ?? null;
      const timeSinceLatest =
        latestTimestamp !== null ? (Date.now() - latestTimestamp) / MILLISECONDS_IN_SECOND : null;
      logger.verbose(
        `User ${senderId} last submitted a request ${timeSinceLatest ?? "<never>"} seconds ago`
      );
      logger.verbose(new Date());
      if (
        cooldown !== null &&
        cooldown > 0 &&
        timeSinceLatest !== null &&
        cooldown > timeSinceLatest
      ) {
        const rejectionBuilder = new StringBuilder();
        rejectionBuilder.push("You must wait ");
        rejectionBuilder.pushBold(`${durationString(cooldown - timeSinceLatest)}`);
        rejectionBuilder.push(" before submitting again.");
        return reject_private(rejectionBuilder.result());
      }

      // If the song is too long, reject!
      const maxDuration = config.entryDurationSeconds;
      if (maxDuration !== null && maxDuration > 0 && seconds > maxDuration) {
        const rejectionBuilder = new StringBuilder();
        rejectionBuilder.push("That song is too long. The limit is ");
        rejectionBuilder.pushBold(`${durationString(maxDuration)}`);
        return reject_public(rejectionBuilder.result());
      }

      // Whether We haven't had this link embedded yet
      const shouldSendUrl = !song.fromUrl;

      // Full send!
      return accept({ url, seconds, sentAt, senderId }, shouldSendUrl);

      // Handle fetch errors
    } catch (error) {
      logger.error(
        `Failed to run query: ${JSON.stringify(args)}, ${JSON.stringify(error, undefined, 2)}`
      );
      return reject_public("That query gave me an error.");
    }
  }
};

export default sr;
