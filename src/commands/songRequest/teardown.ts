import type { NamedSubcommand } from "../Command";
import { useLogger } from "../../logger";
import { reply } from "./actions";
import { useGuildStorage } from "../../useGuildStorage";
import { replyPrivately } from "../../actions/messages";
import userIsQueueCreator from "../../actions/userIsQueueCreator";

const logger = useLogger();

const teardown: NamedSubcommand = {
  name: "teardown",
  requiredArgFormat: "<channel name>",
  description: "Deletes and un-sets the current queue. *(Server owner only. No touch!)*",
  async execute({ message }) {
    if (!message.guild) {
      return reply(message, "Can't do that here.");
    }

    // Only the guild owner may touch the queue.
    if (!(await userIsQueueCreator(message.author, message.guild))) {
      await replyPrivately(message, "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }

    const guild = await useGuildStorage(message.guild);
    logger.info(`Forgetting queue channel for guild ${message.guild.id}.`);
    await Promise.all([
      guild.setQueueChannel(null), //
      reply(message, "Queue deleted.")
    ]);
  }
};

export default teardown;
