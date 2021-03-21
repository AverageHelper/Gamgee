import type { NamedSubcommand } from "./../index";
import { reply } from "./index";
import { useQueue } from "../../actions/queue/useQueue";
import getQueueChannel from "../../actions/queue/getQueueChannel";

const restart: NamedSubcommand = {
  name: "restart",
  description:
    "Empties the queue and starts a fresh queue session. *(Server owner only. No touch!)*",
  async execute(context) {
    const { message } = context;

    // Only the guild owner may touch the queue.
    // FIXME: Add more grannular access options
    if (!message.guild?.ownerID || message.author.id !== message.guild.ownerID) {
      return reply(message, "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
    }

    const channel = await getQueueChannel(context);
    if (!channel) {
      return reply(message, "No queue is set up. Maybe that's what you wanted...?");
    }
    await reply(message, "Time for a reset! :bucket: Clearing the queue...");
    void message.channel.startTyping(5);

    const queue = await useQueue(channel);
    const deleteMessages = (await queue.getAllEntries())
      .map(entry => entry.queueMessageId)
      .map(messageId => channel.messages.delete(messageId));
    await Promise.all(deleteMessages);
    await queue.clear();
    return reply(message, "The queue has restarted.");
  }
};

export default restart;
