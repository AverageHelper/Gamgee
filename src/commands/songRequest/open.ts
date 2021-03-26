import type { NamedSubcommand } from "../Command";
import { reply } from "./actions";
import { useGuildStorage } from "../../useGuildStorage";
import { deleteMessage, replyPrivately } from "../../actions/messages";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import userIsQueueAdmin from "../../actions/userIsQueueAdmin";

const open: NamedSubcommand = {
  name: "open",
  description: "Start accepting song requests to the queue.",
  async execute({ message }) {
    if (!message.guild) {
      return reply(message, "Can't do that here.");
    }

    const [guild, channel] = await Promise.all([
      useGuildStorage(message.guild),
      getQueueChannel(message),
      deleteMessage(message, "Users don't need to see this command once it's run.")
    ]);

    // The queue may only be opened in the queue channel, or by the server owner.
    if (
      !(await userIsQueueAdmin(message.author, message.guild)) &&
      message.channel.id !== channel?.id
    ) {
      await replyPrivately(message, "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }

    if (!channel) {
      return reply(message, "There's no queue to open. Have you set one up yet?");
    }
    const isAlreadyOpen = await guild.getQueueOpen();
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
