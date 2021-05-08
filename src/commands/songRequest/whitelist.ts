import type { Subcommand } from "../Command";
import { useQueueStorage } from "../../useQueueStorage";
import { userIsAdminForQueueInGuild } from "../../permissions";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import getUserFromMention from "../../helpers/getUserFromMention";
import logUser from "../../helpers/logUser";

const whitelist: Subcommand = {
  name: "whitelist",
  options: [
    {
      name: "user",
      description: "The user to allow to request songs.",
      type: "USER",
      required: true
    }
  ],
  type: "SUB_COMMAND",
  description:
    "Allows a previously-blacklisted user to make song requests. *(Server owner only. No touch!)*",
  async execute({ user, guild, options, logger, reply, replyPrivately, deleteInvocation }) {
    if (!guild) {
      return reply("Can't do that here.");
    }

    // Only the queue admin or server owner may touch the queue.
    if (!(await userIsAdminForQueueInGuild(user, guild))) {
      await replyPrivately("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }

    const userMention = options[0]?.value as string | undefined;
    if (userMention === undefined || !userMention) {
      return reply(":x: You'll need to tell me who to whitelist. Try again, and mention someone.");
    }

    const [subject, queueChannel] = await Promise.all([
      getUserFromMention(guild, userMention),
      getQueueChannel(guild)
    ]);

    if (!subject) {
      return reply(":x: I don't know who that is.");
    }

    if (subject.id === user.id) {
      return reply(":x: You can't whitelist yourself, silly!");
    }

    if (!queueChannel) {
      return reply(":x: There's no queue set up yet.");
    }

    const queue = useQueueStorage(queueChannel);
    await queue.whitelistUser(subject.id);
    logger.info(`Restored song request permission to user ${logUser(subject)}.`);

    await reply(`:checkered_flag: <@!${subject.id}> is allowed to submit song requests! :grin:`, {
      shouldMention: false
    });
    await deleteInvocation();
  }
};

export default whitelist;
