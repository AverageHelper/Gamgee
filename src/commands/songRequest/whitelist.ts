import type { NamedSubcommand } from "../Command";
import { reply } from "./actions";
import { useQueueStorage } from "../../useQueueStorage";
import { deleteMessage, replyPrivately } from "../../actions/messages";
import { userIsAdminForQueueInGuild } from "../../permissions";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import getUserFromMention from "../../helpers/getUserFromMention";
import logUser from "../../helpers/logUser";

const whitelist: NamedSubcommand = {
  name: "whitelist",
  requiredArgFormat: "<user mention>",
  description:
    "Allows a previously-blacklisted user to make song requests. *(Server owner only. No touch!)*",
  async execute({ message, args, logger }) {
    if (!message.guild) {
      return reply(message, "Can't do that here.");
    }

    // Only the queue admin or server owner may touch the queue.
    if (!(await userIsAdminForQueueInGuild(message.author, message.guild))) {
      await replyPrivately(message, "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }

    const userMention = args[1];
    if (userMention === undefined || !userMention) {
      return reply(
        message,
        ":x: You'll need to tell me who to whitelist. Try again, and mention someone."
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
      return reply(message, ":x: You can't whitelist yourself, silly!");
    }

    if (!queueChannel) {
      return reply(message, ":x: There's no queue set up yet.");
    }

    const queue = useQueueStorage(queueChannel);
    await queue.whitelistUser(user.id);
    logger.info(`Restored user ${logUser(user)}'s permission to submit song requests.`);

    await replyPrivately(
      message,
      `:checkered_flag: The user <@!${user.id}> is allowed to submit song requests! :grin:`
    );
    await deleteMessage(message, "Users need not see this command when it's run.");
  }
};

export default whitelist;
