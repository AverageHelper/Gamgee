import type { Subcommand } from "../Command";
import { useGuildStorage } from "../../useGuildStorage";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import { userIsAdminForQueueInGuild } from "../../permissions";

const close: Subcommand = {
  name: "close",
  description: "Stop accepting song requests to the queue.",
  type: "SUB_COMMAND",
  async execute({ user, guild, channel, reply, replyPrivately, deleteInvocation }) {
    if (!guild) {
      return reply("Can't do that here.");
    }

    const guildStorage = useGuildStorage(guild);
    const [isQueueOpen, queueChannel] = await Promise.all([
      guildStorage.isQueueOpen(),
      getQueueChannel(guild),
      deleteInvocation()
    ]);

    if (!(await userIsAdminForQueueInGuild(user, guild)) && channel?.id !== queueChannel?.id) {
      return replyPrivately("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
    }
    if (!queueChannel) {
      return reply("There's no queue to close. Have you set one up yet?", { ephemeral: true });
    }
    if (!isQueueOpen) {
      return reply("The queue is already closed, silly! :stuck_out_tongue:", { ephemeral: true });
    }

    const queueIsCurrent = channel?.id === queueChannel.id;
    const promises: Array<Promise<unknown>> = [guildStorage.setQueueOpen(false)];
    if (!queueIsCurrent) {
      promises.push(queueChannel.send("This queue is closed. :wave:"));
    }
    await Promise.all(promises);
    return reply("The queue is now closed. :wave:");
  }
};

export default close;
