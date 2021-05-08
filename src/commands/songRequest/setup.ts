import type Discord from "discord.js";
import type { Subcommand } from "../Command";
// import getChannelFromMention from "../../helpers/getChannelFromMention";
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
    const {
      user,
      guild: messageGuild,
      options,
      logger,
      reply,
      replyPrivately,
      deleteInvocation
    } = context;

    if (!messageGuild) {
      return reply("Can't do that here.");
    }

    await deleteInvocation();

    // Only the guild owner may touch the queue.
    if (!(await userIsAdminInGuild(user, messageGuild))) {
      await replyPrivately("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }

    const channel = options[0]?.channel as Discord.GuildChannel | undefined;
    if (!channel) return reply(`Please name a text channel to use for the queue!`);

    // const channel = getChannelFromMention(messageGuild, channelName);
    // if (!channel) {
    //   return reply(
    //     "That's not a real channel, or I don't know how to find it yet. Mention the channel with `#`."
    //   );
    // }

    if (!channel.isText()) {
      return reply("I can't queue in a voice channel. Please specify a text channel instead");
    }

    const guild = useGuildStorage(messageGuild);
    logger.info(`Setting up channel '${channel.name}' for queuage.`);
    await Promise.all([
      guild.setQueueChannel(channel.id),
      channel.send("This is a queue now. :smiley:")
    ]);
  }
};

export default setup;
