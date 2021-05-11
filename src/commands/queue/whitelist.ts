import type { Subcommand } from "../Command";
import { useQueueStorage } from "../../useQueueStorage";
import { userIsAdminForQueueInGuild } from "../../permissions";
import { resolveUserFromOption } from "../../helpers/resolvers";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import logUser from "../../helpers/logUser";

const whitelist: Subcommand = {
  name: "whitelist",
  description:
    "Allows a previously-blacklisted user to make song requests. *(Server owner only. No touch!)*",
  options: [
    {
      name: "user",
      description: "The user to allow to request songs.",
      type: "USER",
      required: true
    }
  ],
  type: "SUB_COMMAND",
  requiresGuild: true,
  async execute({ user, guild, options, logger, reply, replyPrivately, deleteInvocation }) {
    await deleteInvocation();

    // Only the queue admin or server owner may touch the queue.
    if (!(await userIsAdminForQueueInGuild(user, guild))) {
      return replyPrivately("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
    }

    const option = options[0];
    if (!option) {
      return reply(":x: You'll need to tell me who to whitelist. Try again, and mention someone.", {
        ephemeral: true
      });
    }

    const [subject, queueChannel] = await Promise.all([
      resolveUserFromOption(option, guild),
      getQueueChannel(guild)
    ]);

    if (!subject) {
      return reply(":x: I don't know who that is.", { ephemeral: true });
    }

    if (subject.id === user.id) {
      return reply(":x: You can't whitelist yourself, silly!", { ephemeral: true });
    }

    if (!queueChannel) {
      return reply(":x: There's no queue set up yet.", { ephemeral: true });
    }

    const queue = useQueueStorage(queueChannel);
    await queue.whitelistUser(subject.id);
    logger.info(`Restored song request permission to user ${logUser(subject)}.`);

    return reply(`:checkered_flag: <@!${subject.id}> is allowed to submit song requests! :grin:`, {
      shouldMention: false,
      ephemeral: true
    });
  }
};

export default whitelist;
