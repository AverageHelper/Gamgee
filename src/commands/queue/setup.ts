import type Discord from "discord.js";
import type { Subcommand } from "../Command";
import getChannelFromMention from "../../helpers/getChannelFromMention";
import { useGuildStorage } from "../../useGuildStorage";
import { userIsAdminInGuild } from "../../permissions";

const setup: Subcommand = {
  name: "setup",
  description: "Set a channel as the 'queue' channel. *(Server owner only. No touch!)*",
  options: [
    {
      name: "channel",
      description: "The channel to use as the 'queue' channel for the server",
      type: "CHANNEL",
      required: true
    }
  ],
  type: "SUB_COMMAND",
  async execute(context) {
    const { user, guild, options, logger, reply, replyPrivately, deleteInvocation } = context;

    if (!guild) {
      return reply("Can't do that here.");
    }

    await deleteInvocation();

    // Only the guild owner may touch the queue.
    if (!(await userIsAdminInGuild(user, guild))) {
      await replyPrivately("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }

    let newQueueChannel: Discord.GuildChannel | string | undefined =
      (options[0]?.channel as Discord.GuildChannel | undefined) ??
      (options[0]?.value as string | undefined);

    if (newQueueChannel === undefined)
      return reply(`Please name a text channel to use for the queue!`);

    if (typeof newQueueChannel === "string") {
      newQueueChannel = getChannelFromMention(guild, newQueueChannel);
      if (!newQueueChannel) {
        return reply(
          "That's not a real channel, or I don't know how to find it yet. Mention the channel with `#`."
        );
      }
    }

    if (!newQueueChannel.isText()) {
      return reply("I can't queue in a voice channel. Please specify a text channel instead");
    }

    const guildStorage = useGuildStorage(guild);
    logger.info(`Setting up channel '${newQueueChannel.name}' for queuage.`);
    await Promise.all([
      guildStorage.setQueueChannel(newQueueChannel.id),
      newQueueChannel.send("This is a queue now. :smiley:")
    ]);
    await reply(`New queue set up in <#${newQueueChannel.id}>`, { ephemeral: true });
  }
};

export default setup;
