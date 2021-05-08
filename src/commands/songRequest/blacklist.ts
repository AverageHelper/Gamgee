import type { Subcommand } from "../Command";
import { useQueueStorage } from "../../useQueueStorage";
import { userIsAdminForQueueInGuild } from "../../permissions";
import { getConfigCommandPrefix } from "../../actions/config/getConfigValue";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import getUserFromMention from "../../helpers/getUserFromMention";
import logUser from "../../helpers/logUser";

import parentCommand from "../songRequest";
import whitelist from "./whitelist";
import StringBuilder from "../../helpers/StringBuilder";

const blacklist: Subcommand = {
  name: "blacklist",
  description: "Bars a user from making song requests. *(Server owner only. No touch!)*",
  type: "SUB_COMMAND",
  options: [
    {
      name: "user",
      description: "The user to block from the song request queue",
      type: "USER",
      required: true
    }
  ],
  async execute(context) {
    const {
      guild,
      user,
      options,
      storage,
      logger,
      reply,
      replyPrivately,
      deleteInvocation
    } = context;

    if (!guild) {
      return reply("Can't do that here.");
    }

    // Only the queue admin or server owner may touch the queue.
    if (!(await userIsAdminForQueueInGuild(user, guild))) {
      await replyPrivately("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }

    const queueChannel = await getQueueChannel(guild);
    if (!queueChannel) {
      return reply(":x: There's no queue set up yet.");
    }

    const queue = useQueueStorage(queueChannel);

    const userMention = options[0]?.value as string | undefined;
    if (userMention === undefined || !userMention) {
      await reply(":paperclip: Check the list in your DMs");

      const queueConfig = await queue.getConfig();
      const blacklistedUsers = queueConfig.blacklistedUsers.map(user => user.id);

      const prefix = await getConfigCommandPrefix(storage);
      const guildName = guild.name.trim();

      const replyBuilder = new StringBuilder();

      replyBuilder.push(`**Song Request Blacklist for *${guildName}***`);
      replyBuilder.pushNewLine();
      if (blacklistedUsers.length === 0) {
        replyBuilder.push(" - Nobody. (Let's hope it remains this way.)");
        replyBuilder.pushNewLine();
      }

      blacklistedUsers.forEach(userId => {
        replyBuilder.push(` - <@${userId}>`);
        replyBuilder.pushNewLine();
      });

      replyBuilder.pushNewLine();
      replyBuilder.push("To add a user to the blacklist, run ");
      replyBuilder.pushCode(`${prefix}${parentCommand.name} ${blacklist.name} <user mention>`);
      replyBuilder.push(".");

      replyBuilder.pushNewLine();
      replyBuilder.push("To remove a user from the blacklist, run ");
      replyBuilder.pushCode(`${prefix}${parentCommand.name} ${whitelist.name} <user mention>`);
      replyBuilder.push(".");
      replyBuilder.pushNewLine();
      replyBuilder.push("(Run these in ");
      replyBuilder.push(`*${guildName}*`);
      replyBuilder.push(", obviously)");

      await replyPrivately(replyBuilder.result());
      return;
    }

    const subject = await getUserFromMention(guild, userMention);
    if (!subject) {
      return reply(":x: I don't know who that is.");
    }

    if (subject.id === user.id) {
      return reply(":x: You can't blacklist yourself, silly!");
    }

    if (subject.id === guild.ownerID) {
      return reply(":x: I can't blacklist the owner. That would be rude!");
    }

    await queue.blacklistUser(subject.id);
    logger.info(`Removed song request permission from user ${logUser(subject)}.`);

    await reply(`:pirate_flag: <@!${subject.id}> is no longer allowed to submit song requests.`, {
      shouldMention: false
    });
    await deleteInvocation();
  }
};

export default blacklist;
