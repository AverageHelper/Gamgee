import type { Subcommand } from "../Command";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import { useQueue } from "../../actions/queue/useQueue";
import { userIsAdminForQueueInGuild } from "../../permissions";
import { bulkDeleteMessagesWithIds } from "../../actions/messages";

const restart: Subcommand = {
  name: "restart",
  description: "Empty the queue and start a fresh queue session.",
  type: "SUB_COMMAND",
  async execute(context) {
    const {
      user,
      guild,
      channel: messageChannel,
      reply,
      replyPrivately,
      startTyping,
      stopTyping
    } = context;

    if (!guild) {
      return reply("Can't do that here.");
    }

    const channel = await getQueueChannel(guild);

    // Only the queue admin may touch the queue, unless we're in the privileged queue channel.
    if (!(await userIsAdminForQueueInGuild(user, guild)) && messageChannel?.id !== channel?.id) {
      await replyPrivately("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }
    if (!channel) {
      return reply("No queue is set up. Maybe that's what you wanted...?");
    }

    await reply("Time for a reset! :bucket: Clearing the queue...");
    startTyping(5);

    const queue = useQueue(channel);
    const toBeDeleted = (await queue.getAllEntries()).map(entry => entry.queueMessageId);
    await bulkDeleteMessagesWithIds(toBeDeleted, channel);
    await queue.clear();

    stopTyping();

    return reply("The queue has restarted.");
  }
};

export default restart;
