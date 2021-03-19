import { useQueue, UnsentQueueEntry } from "../actions/useQueue";
import type { Command } from "./index";
import { useLogger } from "../logger";
import getVideoDetails from "../actions/getVideoDetails";
import getQueueChannel from "../actions/getQueueChannel";
import durationString from "../helpers/durationString";
import StringBuilder from "../helpers/StringBuilder";

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

    async function reject_private(reason: string) {
      await message.author.send(reason);
    }
    async function reject_public(reason: string) {
      await Promise.all([
        message.channel.send(`:hammer: <@!${message.author.id}> ${reason}`), //
        message.suppressEmbeds(true)
      ]);
    }

    const queueChannel = await getQueueChannel(context);
    if (!queueChannel) {
      return reject_public("The queue is not open.");
    }

    if (message.channel.id === queueChannel.id) {
      // TODO: The ability to configure a specific channel from which song requests should be taken.
      await Promise.all([
        message
          .delete({ reason: "Spam; Song requests are not permitted in the queue channel." })
          .catch(error =>
            logger.error(
              `I don't seem to have permission to delete messages: ${JSON.stringify(
                error,
                undefined,
                2
              )}`
            )
          ),
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

      // If the song is too long, reject!
      const maxDuration = (await queue.getConfig()).entryDurationSeconds;
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
