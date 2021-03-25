import type { NamedSubcommand } from "./../index";
import { useLogger } from "../../logger";
import { reply } from "./index";
import { useGuildStorage } from "../../useGuildStorage";
import getChannelFromMention from "../../helpers/getChannelFromMention";
import { deleteMessage, replyPrivately } from "../../actions/messages";
import userIsQueueCreator from "../../actions/userIsQueueCreator";

const logger = useLogger();

const setup: NamedSubcommand = {
  name: "setup",
  requiredArgFormat: "<channel name>",
  description: "Set a channel as the 'queue' channel. *(Server owner only. No touch!)*",
  async execute({ message, args }) {
    if (!message.guild) {
      return reply(message, "Can't do that here.");
    }

    await deleteMessage(message, "Users don't need to see this command once it's run.");

    // Only the guild owner may touch the queue.
    if (!(await userIsQueueCreator(message.author, message.guild))) {
      await replyPrivately(message, "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }

    const channelName = args[1];
    if (!channelName) return reply(message, `Please name a text channel to use for the queue!`);

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

    const guild = await useGuildStorage(message.guild);
    logger.info(`Setting up channel '${channel.name}' for queuage.`);
    await Promise.all([
      guild.setQueueChannel(channel.id),
      channel.send("This is a queue now. :smiley:")
    ]);
  }
};

export default setup;
