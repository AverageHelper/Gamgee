import type { NamedSubcommand } from "../Command";
import { reply } from "./actions";
import { useQueue } from "../../actions/queue/useQueue";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import userIsQueueAdmin from "../../actions/userIsQueueAdmin";
import { bulkDeleteMessagesWithIds, replyPrivately } from "../../actions/messages";

const restart: NamedSubcommand = {
  name: "restart",
  description: "Empty the queue and start a fresh queue session.",
  async execute({ message }) {
    if (!message.guild) {
      return reply(message, "Can't do that here.");
    }

    const channel = await getQueueChannel(message);

    // Only the queue admin may touch the queue, unless we're in the privileged queue channel.
    if (
      !(await userIsQueueAdmin(message.author, message.guild)) &&
      message.channel.id !== channel?.id
    ) {
      await replyPrivately(message, "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }
    if (!channel) {
      return reply(message, "No queue is set up. Maybe that's what you wanted...?");
    }

    await reply(message, "Time for a reset! :bucket: Clearing the queue...");
    void message.channel.startTyping(5);

    const queue = useQueue(channel);
    const toBeDeleted = (await queue.getAllEntries()).map(entry => entry.queueMessageId);
    await bulkDeleteMessagesWithIds(toBeDeleted, channel);
    await queue.clear();

    // TODO: Do we need to force-stop the typing indicator here?
    return reply(message, "The queue has restarted.");
  }
};

export default restart;
