import type { ArbitrarySubcommand } from "../Command";
import { useJobQueue } from "../../actions/queue/jobQueue";
import { reject_public, reject_private } from "./actions";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import { deleteMessage } from "../../actions/messages";
import { useGuildStorage } from "../../useGuildStorage";
import type { SongRequest } from "../../actions/queue/processSongRequest";
import processRequest from "../../actions/queue/processSongRequest";

const urlRequest: ArbitrarySubcommand = {
  format: "<YouTube, SoundCloud, or Bandcamp link>",
  description: "Attempts to add the given content to the queue.",
  async execute({ args, message, logger }): Promise<void> {
    if (!message.guild) {
      return;
    }

    const queueChannel = await getQueueChannel(message);
    if (!queueChannel) {
      return reject_public(message, "No queue is set up.");
    }

    if (message.channel.id === queueChannel?.id) {
      await Promise.all([
        deleteMessage(message),
        reject_private(
          message,
          "Requesting songs in the queue channel has not been implemented yet."
        )
      ]);
      return;
    }

    const guild = useGuildStorage(message.guild);
    const isQueueOpen = await guild.isQueueOpen();
    if (!isQueueOpen) {
      return reject_public(message, "The queue is not open.");
    }

    const requestQueue = useJobQueue<SongRequest>("urlRequest");
    requestQueue.process(processRequest); // Same function instance, so a nonce call

    requestQueue.on("start", () => {
      void queueChannel.startTyping();
    });
    requestQueue.on("finish", () => {
      queueChannel.stopTyping(true);
    });

    requestQueue.createJob({ requestArgs: args, message, queueChannel, logger });
  }
};

export default urlRequest;
