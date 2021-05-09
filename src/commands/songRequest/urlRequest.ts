import type { Subcommand } from "../Command";
import type { SongRequest } from "../../actions/queue/processSongRequest";
import { useJobQueue } from "../../actions/queue/jobQueue";
import { reject_public, reject_private } from "./actions";
import { useGuildStorage } from "../../useGuildStorage";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import processRequest from "../../actions/queue/processSongRequest";

const urlRequest: Subcommand = {
  name: "url",
  description: "A YouTube, SoundCloud, or Bandcamp link",
  type: "STRING",
  async execute(context) {
    const { guild, channel, options, logger, reply, deleteInvocation } = context;

    if (!guild) {
      return reply("Can't do that here.");
    }

    const queueChannel = await getQueueChannel(guild);
    if (!queueChannel) {
      return reject_public(context, "No queue is set up.");
    }

    if (channel?.id === queueChannel.id) {
      await Promise.all([
        deleteInvocation(),
        reject_private(
          context,
          "Requesting songs in the queue channel has not been implemented yet."
        )
      ]);
      return;
    }

    const guildStorage = useGuildStorage(guild);
    const isQueueOpen = await guildStorage.isQueueOpen();
    if (!isQueueOpen) {
      return reject_public(context, "The queue is not open.");
    }

    const requestQueue = useJobQueue<SongRequest>("urlRequest");
    requestQueue.process(processRequest); // Same function instance, so a nonce call

    requestQueue.on("start", () => {
      void queueChannel.startTyping();
    });
    requestQueue.on("finish", () => {
      queueChannel.stopTyping(true);
    });

    requestQueue.createJob({ songUrl: options[0]?.value as string, context, queueChannel, logger });
  }
};

export default urlRequest;
