import type { Subcommand } from "../Command";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import { useQueue } from "../../actions/queue/useQueue";
import { userIsAdminForQueueInGuild } from "../../permissions";
import { bulkDeleteMessagesWithIds } from "../../actions/messages";

const restart: Subcommand = {
  name: "restart",
  description: "Empty the queue and start a fresh queue session.",
  type: "SUB_COMMAND",
  requiresGuild: true,
  async execute({ user, guild, channel, prepareForLongRunningTasks, reply, replyPrivately }) {
    const queueChannel = await getQueueChannel(guild);

    // Only the queue admin may touch the queue, unless we're in the privileged queue channel.
    if (!(await userIsAdminForQueueInGuild(user, guild)) && channel?.id !== queueChannel?.id) {
      return replyPrivately("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
    }
    if (!queueChannel) {
      return reply("No queue is set up. Maybe that's what you wanted...?");
    }

    await prepareForLongRunningTasks();

    const queue = useQueue(queueChannel);
    const toBeDeleted = (await queue.getAllEntries()).map(entry => entry.queueMessageId);
    await bulkDeleteMessagesWithIds(toBeDeleted, queueChannel);
    await queue.clear();

    return reply("The queue has restarted.");
  }
};

export default restart;
