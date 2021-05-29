import type { Command } from "./Command";
import type { SongRequest } from "../actions/queue/processSongRequest";
import { isNonEmptyArray } from "../helpers/guards";
import { resolveStringFromOption } from "../helpers/optionResolvers";
import { useGuildStorage } from "../useGuildStorage";
import { useJobQueue } from "../actions/queue/jobQueue";
import getQueueChannel from "../actions/queue/getQueueChannel";
import processRequest, { reject_private, reject_public } from "../actions/queue/processSongRequest";

const sr: Command = {
  name: "sr",
  description: "Submit a song to the queue.",
  options: [
    {
      name: "url",
      description: "A YouTube, SoundCloud, or Bandcamp link",
      type: "STRING",
      required: true
    }
  ],
  requiresGuild: true,
  async execute(context) {
    const {
      guild,
      channel,
      options,
      logger,
      prepareForLongRunningTasks,
      deleteInvocation
    } = context;

    const queueChannel = await getQueueChannel(guild);
    if (!queueChannel) {
      return reject_public(context, "No queue is set up.");
    }

    if (!isNonEmptyArray(options)) {
      const howTo = (await import("./howto")).default;
      return howTo.execute(context);
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

    await prepareForLongRunningTasks();

    const songUrl: string = resolveStringFromOption(options[0]);
    if (context.type === "interaction") {
      await context.reply(songUrl);
    }

    const requestQueue = useJobQueue<SongRequest>("urlRequest");
    requestQueue.process(processRequest); // Same function instance, so a nonce call

    requestQueue.createJob({ songUrl, context, queueChannel, logger });
  }
};

export default sr;
