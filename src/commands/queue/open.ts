import type { Subcommand } from "../Command";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import { useGuildStorage } from "../../useGuildStorage";
import { userIsAdminForQueueInGuild } from "../../permissions";

const open: Subcommand = {
  name: "open",
  description: "Start accepting song requests to the queue.",
  type: "SUB_COMMAND",
  async execute({ user, guild, channel, reply, replyPrivately, deleteInvocation }) {
    if (!guild) {
      return reply("Can't do that here.");
    }

    const guildStorage = useGuildStorage(guild);
    const [queueChannel] = await Promise.all([
      getQueueChannel(guild), //
      deleteInvocation()
    ]);

    // The queue may only be opened in the queue channel, or by the server owner.
    if (!(await userIsAdminForQueueInGuild(user, guild)) && channel?.id !== queueChannel?.id) {
      return replyPrivately("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
    }

    if (!queueChannel) {
      return reply("There's no queue to open. Have you set one up yet?", { ephemeral: true });
    }
    const isAlreadyOpen = await guildStorage.isQueueOpen();
    if (isAlreadyOpen) {
      return reply("The queue's already open! :smiley:", { ephemeral: true });
    }

    await guildStorage.setQueueOpen(true);

    const queueIsCurrent = channel?.id === queueChannel.id;
    await queueChannel.send("This queue is now open! :smiley:");
    if (!queueIsCurrent) {
      return reply(`The queue is now open! :smiley:`);
    }
  }
};

export default open;
