import type { NamedSubcommand } from "../Command";
import { reply } from "./actions";
import { useQueueStorage } from "../../useQueueStorage";
import { deleteMessage, replyPrivately } from "../../actions/messages";
import { userIsAdminForQueueInGuild } from "../../permissions";
import { getConfigCommandPrefix } from "../../actions/config/getConfigValue";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import getUserFromMention from "../../helpers/getUserFromMention";
import logUser from "../../helpers/logUser";

import parentCommand from "../songRequest";
import whitelist from "./whitelist";
import StringBuilder from "../../helpers/StringBuilder";

const blacklist: NamedSubcommand = {
  name: "blacklist",
  requiredArgFormat: "<user mention>",
  description: "Bars a user from making song requests. *(Server owner only. No touch!)*",
  async execute({ message, args, logger, storage }) {
    if (!message.guild) {
      return reply(message, "Can't do that here.");
    }

    // Only the queue admin or server owner may touch the queue.
    if (!(await userIsAdminForQueueInGuild(message.author, message.guild))) {
      await replyPrivately(message, "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }

    const queueChannel = await getQueueChannel(message);
    if (!queueChannel) {
      return reply(message, ":x: There's no queue set up yet.");
    }

    const queue = useQueueStorage(queueChannel);

    const userMention = args[1];
    if (userMention === undefined || !userMention) {
      await reply(message, ":paperclip: Check the list in your DMs");

      const queueConfig = await queue.getConfig();
      const blacklistedUsers = queueConfig.blacklistedUsers.map(user => user.id);

      const prefix = await getConfigCommandPrefix(storage);
      const guildName = message.guild.name.trim();

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
      replyBuilder.pushCode(
        `${prefix}${parentCommand.name} ${blacklist.name} ${blacklist.requiredArgFormat ?? "<>"}`
      );
      replyBuilder.push(".");

      replyBuilder.pushNewLine();
      replyBuilder.push("To remove a user from the blacklist, run ");
      replyBuilder.pushCode(
        `${prefix}${parentCommand.name} ${whitelist.name} ${whitelist.requiredArgFormat ?? "<>"}`
      );
      replyBuilder.push(".");
      replyBuilder.pushNewLine();
      replyBuilder.push("(Run these in ");
      replyBuilder.push(`*${guildName}*`);
      replyBuilder.push(", obviously)");

      await replyPrivately(message, replyBuilder.result());
      return;
    }

    const user = await getUserFromMention(message, userMention);
    if (!user) {
      return reply(message, ":x: I don't know who that is.");
    }

    if (user.id === message.author.id) {
      return reply(message, ":x: You can't blacklist yourself, silly!");
    }

    if (user.id === message.guild.ownerID) {
      return reply(message, ":x: I can't blacklist the owner. That would be rude!");
    }

    await queue.blacklistUser(user.id);
    logger.info(`Removed song request permission from user ${logUser(user)}.`);

    await reply(
      message,
      `:pirate_flag: <@!${user.id}> is no longer allowed to submit song requests.`,
      false
    );
    await deleteMessage(message, "Users need not see this command when it's run.");
  }
};

export default blacklist;
