import type { NamedSubcommand } from "./../index";
import { useLogger } from "../../logger";
import { reply } from "./index";
import { setConfigQueueChannel } from "../../actions/config/setConfigValue";
import getChannelFromMention from "../../helpers/getChannelFromMention";

const logger = useLogger();

const open: NamedSubcommand = {
  name: "open",
  requiredArgFormat: "<channel name>",
  description:
    "Sets a channel up as a new queue. Any existing queue is saved, but queue and request commands will go to this new queue instead. *(Server owner only. No touch!)*",
  async execute({ args, message, storage }) {
    // Only the guild owner may touch the queue.
    // FIXME: Add more grannular access options
    if (!message.guild?.ownerID || message.author.id !== message.guild.ownerID) {
      return reply(message, "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
    }

    if (args.length < 2) {
      return reply(message, `Please name a text channel to use for the queue!`);
    }
    const channelName = args[1];
    const channel = getChannelFromMention(message, channelName);
    if (!channel) {
      return reply(
        message,
        "That's not a real channel, or I don't know how to find it yet. Mention the channel with `#`."
      );
    }

    if (!channel.isText()) {
      return reply(
        message,
        "I can't queue in a voice channel. Please specify a text channel instead"
      );
    }

    logger.info(`Setting up channel '${channel.name}' for queuage.`);
    await Promise.all([
      setConfigQueueChannel(storage, channel.id),
      channel.send("This is a queue now. :smiley:"),
      message
        .delete({ reason: "Users don't need to see this command once it's run." })
        .catch(error =>
          logger.error(
            `I don't seem to have permission to delete messages: ${JSON.stringify(
              error,
              undefined,
              2
            )}`
          )
        )
    ]);

    const queueIsCurrent = message.channel.id === channel?.id;
    if (!queueIsCurrent) {
      return reply(message, `The queue is now open! :smiley:`);
    }
    return;
  }
};

export default open;
