import type { Subcommand } from "../Command";
import { useGuildStorage } from "../../useGuildStorage";
import { userIsAdminInGuild } from "../../permissions";

const teardown: Subcommand = {
  name: "teardown",
  description: "Deletes and un-sets the current queue. *(Server owner only. No touch!)*",
  type: "SUB_COMMAND",
  async execute({ user, guild, logger, reply, replyPrivately }) {
    if (!guild) {
      return reply("Can't do that here.");
    }

    // Only the guild owner may touch the queue.
    if (!(await userIsAdminInGuild(user, guild))) {
      return replyPrivately("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
    }

    const guildStorage = useGuildStorage(guild);

    logger.info(`Forgetting queue channel for guild ${guild.id}.`);
    await guildStorage.setQueueChannel(null);
    return reply("Queue deleted.");
  }
};

export default teardown;
