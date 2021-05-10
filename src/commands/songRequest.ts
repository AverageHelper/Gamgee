import type { Command } from "./Command";
import type { SongRequest } from "../actions/queue/processSongRequest";
import processRequest, { reject_private, reject_public } from "../actions/queue/processSongRequest";
import { isNonEmptyArray } from "../helpers/guards";
import { getConfigCommandPrefix } from "../actions/config/getConfigValue";
import { useJobQueue } from "../actions/queue/jobQueue";
import { useGuildStorage } from "../useGuildStorage";
import getQueueChannel from "../actions/queue/getQueueChannel";
import StringBuilder from "../helpers/StringBuilder";

const sr: Command = {
  name: "sr",
  description: "Submit a song to the queue.",
  options: [
    {
      name: "url",
      description: "A YouTube, SoundCloud, or Bandcamp link",
      type: "STRING",
      required: false
    }
  ],
  requiresGuild: true,
  async execute(context) {
    const {
      type,
      guild,
      channel,
      options,
      storage,
      logger,
      prepareForLongRunningTasks,
      reply,
      deleteInvocation
    } = context;

    await prepareForLongRunningTasks();

    const queueChannel = await getQueueChannel(guild);
    if (!queueChannel) {
      return reject_public(context, "No queue is set up.");
    }

    if (!isNonEmptyArray(options)) {
      const nowPlaying = (await import("./nowPlaying")).default;

      // Print the standard help
      const COMMAND_PREFIX = type === "message" ? await getConfigCommandPrefix(storage) : "/";
      const helpBuilder = new StringBuilder();

      helpBuilder.push(`To submit a song, type \`${COMMAND_PREFIX}${sr.name} <link>\`.`);
      helpBuilder.pushNewLine();
      helpBuilder.push(`For example: \`${COMMAND_PREFIX}${sr.name} https://youtu.be/dQw4w9WgXcQ\``);
      helpBuilder.pushNewLine();
      helpBuilder.push(
        "I will respond with a text verification indicating your song has joined the queue!"
      );
      helpBuilder.pushNewLine();
      helpBuilder.pushNewLine();

      helpBuilder.push("To see the current song, type ");
      helpBuilder.pushCode(`${COMMAND_PREFIX}${nowPlaying.name}`);
      if (type === "message") {
        helpBuilder.push(" and check your DMs");
      }
      helpBuilder.push(".");

      return reply(helpBuilder.result());
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

    requestQueue.createJob({ songUrl: options[0].value as string, context, queueChannel, logger });
  }
};

export default sr;
