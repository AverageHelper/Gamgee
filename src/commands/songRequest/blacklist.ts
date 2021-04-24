import type { NamedSubcommand } from "../Command";
import { reply } from "./actions";
import { useQueueStorage } from "../../useQueueStorage";
import { deleteMessage, replyPrivately } from "../../actions/messages";
import { userIsAdminForQueueInGuild } from "../../permissions";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import getUserFromMention from "../../helpers/getUserFromMention";
import logUser from "../../helpers/logUser";

const blacklist: NamedSubcommand = {
  name: "blacklist",
  requiredArgFormat: "<user mention>",
  description: "Bars a user from making song requests. *(Server owner only. No touch!)*",
  async execute({ message, args, logger }) {
    if (!message.guild) {
      return reply(message, "Can't do that here.");
    }

    // Only the queue admin or server owner may touch the queue.
    if (!(await userIsAdminForQueueInGuild(message.author, message.guild))) {
      await replyPrivately(message, "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }

    const userMention = args[0];
    if (userMention === undefined || !userMention) {
      return reply(
        message,
        ":x: You'll need to tell me who to blacklist. Try again, and mention someone."
      );
    }

    const [user, queueChannel] = await Promise.all([
      getUserFromMention(message, userMention),
      getQueueChannel(message)
    ]);

    if (!user) {
      return reply(message, ":x: I don't know who that is.");
    }

    if (user.id === message.author.id) {
      return reply(message, ":x: You can't blacklist yourself, silly!");
    }

    if (user.id === message.guild.ownerID) {
      return reply(message, ":x: I can't blacklist the owner. That would be rude!");
    }

    if (!queueChannel) {
      return reply(message, ":x: There's no queue set up yet.");
    }

    const queue = useQueueStorage(queueChannel);
    await queue.blacklistUser(user.id);
    logger.info(`Blacklisted user ${logUser(user)} from the song request queue.`);

    await replyPrivately(
      message,
      `:pirate_flag: The user <@!${user.id}> is no longer allowed to submit song requests.`
    );
    await deleteMessage(message, "Users need not see this command when it's run.");
  }
};

export default blacklist;
