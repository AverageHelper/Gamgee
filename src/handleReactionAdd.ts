import type Discord from "discord.js";
import { getEnv } from "./helpers/environment";
import { useLogger } from "./logger";
import { useQueue } from "./actions/queue/useQueue";
import { REACTION_BTN_DELETE, REACTION_BTN_DONE, REACTION_BTN_UNDO } from "./constants/reactions";
import getQueueChannel from "./actions/queue/getQueueChannel";
import logUser from "./helpers/logUser";

const LOGGING = true;
const logger = useLogger();

function debugLog(msg: string): void {
  if (LOGGING) logger.debug(msg);
}

export async function handleReactionAdd(
  reaction: Discord.MessageReaction,
  user: Discord.User
): Promise<void> {
  // Ignore bot reactions unless we're being tested
  if (user.bot && getEnv("NODE_ENV") !== "test") {
    logger.silly(
      `Momma always said not to follow strangers. It's rude. bot: ${user.bot ? "true" : "false"}`
    );
    return;
  }
  debugLog(`Handling a reaction. bot: ${user.bot ? "true" : "false"}`);

  // Ignore self reactions
  if (user.id === reaction.client.user?.id) return;

  const message = reaction.message;
  debugLog(`User ${logUser(user)} reacted with ${reaction.emoji.name} to message ${message.id}`);

  const channel = await getQueueChannel(message);
  if (!channel || reaction.message.channel.id !== channel.id) {
    debugLog("There is no queue channel for this guild.");
    return;
  }

  const queue = useQueue(channel);
  const entry = await queue.getEntryFromMessage(message.id);
  if (!entry) {
    debugLog("The message does not represent a known song request.");
    return;
  }

  debugLog(
    `Got entry from message ${entry.queueMessageId} (${entry.isDone ? "Done" : "Not done"})`
  );

  switch (reaction.emoji.name) {
    case REACTION_BTN_DONE:
      debugLog("Marking done....");
      await queue.markDone(message);
      logger.debug("Marked an entry done.");
      break;

    case REACTION_BTN_UNDO:
      debugLog("Marking undone....");
      await queue.markNotDone(message);
      logger.debug("Marked an entry undone");
      break;

    case REACTION_BTN_DELETE:
      debugLog("Deleting entry...");
      await queue.deleteEntryFromMessage(message);
      logger.debug("Deleted an entry");
      break;

    default:
      break;
  }
}
