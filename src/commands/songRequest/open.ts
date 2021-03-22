import type { NamedSubcommand } from "./../index";
import { reply } from "./index";
import { useGuildStorage } from "../../useGuildStorage";
import deleteMessage from "../../actions/deleteMessage";
import getQueueChannel from "../../actions/queue/getQueueChannel";

const open: NamedSubcommand = {
  name: "open",
  description: "Start accepting song requests to the queue. *(Server owner only. No touch!)*",
  async execute(context) {
    const { message } = context;

    // Only the guild owner may touch the queue.
    // FIXME: Add more grannular access options
    if (!message.guild?.ownerID || message.author.id !== message.guild.ownerID) {
      return reply(message, "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
    }

    const [guild, channel] = await Promise.all([
      useGuildStorage(message.guild),
      getQueueChannel(context),
      deleteMessage(message, "Users don't need to see this command once it's run.")
    ]);
    const isAlreadyOpen = await guild.getQueueOpen();

    if (!channel) {
      return reply(message, "There's no queue to open. Have you set one up yet?");
    }
    if (isAlreadyOpen) {
      return reply(message, "The queue's already open! :smiley:");
    }

    await guild.setQueueOpen(true);

    const queueIsCurrent = message.channel.id === channel.id;
    await channel.send("This queue is now open! :smiley:");
    if (!queueIsCurrent) {
      return reply(message, `The queue is now open! :smiley:`);
    }
  }
};

export default open;
