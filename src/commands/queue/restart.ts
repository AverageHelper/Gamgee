import type { Subcommand } from "../Command";
import { bulkDeleteMessagesWithIds } from "../../actions/messages";
import { useQueue } from "../../actions/queue/useQueue";
import getQueueChannel from "../../actions/queue/getQueueChannel";

const restart: Subcommand = {
  name: "restart",
  description: "Empty the queue and start a fresh queue session.",
  type: "SUB_COMMAND",
  requiresGuild: true,
  permissions: ["owner", "queue-admin"],
  async execute({ guild, prepareForLongRunningTasks, reply }) {
    const queueChannel = await getQueueChannel(guild);

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
