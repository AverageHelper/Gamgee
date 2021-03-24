import type { NamedSubcommand } from "./../index";
import { reply } from "./index";
import { useQueue } from "../../actions/queue/useQueue";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import userIsQueueAdmin from "../../actions/userIsQueueAdmin";
import { useLogger } from "../../logger";

const logger = useLogger();

const restart: NamedSubcommand = {
  name: "restart",
  description: "Empty the queue and start a fresh queue session.",
  async execute(context) {
    const { message } = context;

    if (!message.guild) {
      return reply(message, "Can't do that here.");
    }

    const channel = await getQueueChannel(context);

    // Only the queue admin may touch the queue, unless we're in the privileged queue channel.
    if (
      !(await userIsQueueAdmin(message.author, message.guild)) &&
      message.channel.id !== channel?.id
    ) {
      await message.author.send("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }
    if (!channel) {
      return reply(message, "No queue is set up. Maybe that's what you wanted...?");
    }

    await reply(message, "Time for a reset! :bucket: Clearing the queue...");
    void message.channel.startTyping(5);

    const queue = await useQueue(channel);
    const deleteMessages = (await queue.getAllEntries())
      .map(entry => entry.queueMessageId)
      .map(messageId =>
        channel.messages.delete(messageId).catch(error => {
          logger.error(`Failed to delete message: ${JSON.stringify(error, undefined, 2)}`);
        })
      );
    await Promise.all(deleteMessages);
    await queue.clear();
    return reply(message, "The queue has restarted.");
  }
};

export default restart;
