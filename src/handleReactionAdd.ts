import type Discord from "discord.js";
import type { Logger } from "./logger";
import { getEnv } from "./helpers/environment";
import { useQueue } from "./actions/queue/useQueue";
import { REACTION_BTN_DELETE, REACTION_BTN_DONE, REACTION_BTN_UNDO } from "./constants/reactions";
import getQueueChannel from "./actions/queue/getQueueChannel";
import logUser from "./helpers/logUser";

export async function handleReactionAdd(
  reaction: Discord.MessageReaction,
  user: Discord.User,
  logger: Logger
): Promise<void> {
  // Ignore bot reactions unless we're being tested
  if (user.bot && getEnv("NODE_ENV") !== "test") {
    logger.silly(
      `Momma always said not to follow strangers. It's rude. bot: ${user.bot ? "true" : "false"}`
    );
    return;
  }
  logger.debug(`Handling a reaction. bot: ${user.bot ? "true" : "false"}`);

  // Ignore self reactions
  if (user.id === reaction.client.user?.id) return;

  const message = reaction.message;
  logger.debug(
    `User ${logUser(user)} reacted with ${reaction.emoji.name} to message ${message.id}`
  );

  const channel = await getQueueChannel(message);
  if (!channel || reaction.message.channel.id !== channel.id) {
    logger.debug("There is no queue channel for this guild.");
    return;
  }

  const queue = useQueue(channel);
  const entry = await queue.getEntryFromMessage(message.id);
  if (!entry) {
    logger.debug("The message does not represent a known song request.");
    return;
  }

  logger.debug(
    `Got entry from message ${entry.queueMessageId} (${entry.isDone ? "Done" : "Not done"})`
  );

  switch (reaction.emoji.name) {
    case REACTION_BTN_DONE:
      logger.debug("Marking done....");
      await queue.markDone(message);
      logger.debug("Marked an entry done.");
      break;

    case REACTION_BTN_UNDO:
      logger.debug("Marking undone....");
      await queue.markNotDone(message);
      logger.debug("Marked an entry undone");
      break;

    case REACTION_BTN_DELETE:
      logger.debug("Deleting entry...");
      await queue.deleteEntryFromMessage(message);
      logger.debug("Deleted an entry");
      break;

    default:
      break;
  }
}
