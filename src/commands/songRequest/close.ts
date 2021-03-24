import type { NamedSubcommand } from "./../index";
import { reply } from "./index";
import { useGuildStorage } from "../../useGuildStorage";
import { deleteMessage } from "../../actions/messages/deleteMessage";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import userIsQueueAdmin from "../../actions/userIsQueueAdmin";

const close: NamedSubcommand = {
  name: "close",
  description: "Stop accepting song requests to the queue.",
  async execute(context) {
    const { message } = context;

    if (!message.guild) {
      return reply(message, "Can't do that here.");
    }

    const guild = await useGuildStorage(message.guild);
    const [isQueueOpen, queueChannel] = await Promise.all([
      guild.getQueueOpen(),
      getQueueChannel(context),
      deleteMessage(message, "Users don't need to see this command once it's run.")
    ]);

    if (
      !(await userIsQueueAdmin(message.author, message.guild)) &&
      message.channel.id !== queueChannel?.id
    ) {
      await message.author.send("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }
    if (!queueChannel) {
      return reply(message, "There's no queue to close. Have you set one up yet?");
    }
    if (!isQueueOpen) {
      return reply(message, "The queue is already closed, silly! :stuck_out_tongue:");
    }

    const queueIsCurrent = message.channel.id === queueChannel.id;
    const promises: Array<Promise<unknown>> = [guild.setQueueOpen(false)];
    if (!queueIsCurrent) {
      promises.push(queueChannel.send("This queue is closed. :wave:"));
    }
    await Promise.all(promises);
    return reply(message, "The queue is now closed. :wave:");
  }
};

export default close;
