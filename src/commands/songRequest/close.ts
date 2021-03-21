import type { NamedSubcommand } from "./../index";
import { useLogger } from "../../logger";
import { reply } from "./index";
import { setConfigQueueChannel } from "../../actions/config/setConfigValue";
import getQueueChannel from "../../actions/queue/getQueueChannel";

const logger = useLogger();

const close: NamedSubcommand = {
  name: "close",
  description: "Closes the current queue. *(Server owner only. No touch!)*",
  async execute(context) {
    const { message, storage } = context;

    // Only the guild owner may touch the queue.
    // FIXME: Add more grannular access options
    if (!message.guild?.ownerID || message.author.id !== message.guild.ownerID) {
      return reply(message, "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
    }

    const channel = await getQueueChannel(context);
    if (!channel) {
      return reply(message, "There is no open queue to close, silly! :stuck_out_tongue:");
    }
    const queueIsCurrent = message.channel.id === channel?.id;
    const promises: Array<Promise<unknown>> = [
      setConfigQueueChannel(storage, null),
      message
        .delete({ reason: "Users don't need to see this command once it's run." })
        .catch(error =>
          logger.error(
            `I don't seem to have permission to delete messages: ${JSON.stringify(
              error,
              undefined,
              2
            )}`
          )
        )
    ];
    if (channel && !queueIsCurrent) {
      promises.push(channel.send("This queue is closed. :wave:"));
    }
    await Promise.all(promises);
    return reply(message, "The queue is now closed. :wave:");
  }
};

export default close;
