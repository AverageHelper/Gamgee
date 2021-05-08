import type Discord from "discord.js";
import type { Logger } from "./logger";
import { getEnv } from "./helpers/environment";
import { useQueue } from "./actions/queue/useQueue";
import { REACTION_BTN_DELETE, REACTION_BTN_DONE, REACTION_BTN_UNDO } from "./constants/reactions";
import { sendPrivately } from "./actions/messages";
import { getUserWithId } from "./helpers/getUserWithId";
import { useGuildStorage } from "./useGuildStorage";
import getQueueChannel from "./actions/queue/getQueueChannel";
import logUser from "./helpers/logUser";
import StringBuilder from "./helpers/StringBuilder";

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
    `User ${logUser(user)} reacted with ${reaction.emoji.name ?? "unnamed emoji"} to message ${
      message.id
    }`
  );

  const queueChannel = await getQueueChannel(message);
  if (!queueChannel) {
    logger.debug("There is no queue channel for this guild.");
    return;
  }
  if (reaction.message.channel.id !== queueChannel.id) {
    logger.debug("This isn't the queue channel. Ignoring.");
    return;
  }

  const queue = useQueue(queueChannel);
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

    case REACTION_BTN_DELETE: {
      logger.debug("Deleting entry...");
      const entry = await queue.deleteEntryFromMessage(message);
      if (!entry) {
        logger.debug("There was no entry to delete.");
        break;
      }
      logger.debug("Deleted an entry");

      const userId = entry.senderId;
      const guild = reaction.message.guild;
      if (!guild) {
        logger.debug(`Queue message ${reaction.message.id} has no guild.`);
        return;
      }
      const guildStorage = useGuildStorage(guild);
      const user = await getUserWithId(guild, userId);

      logger.verbose(`Informing User ${logUser(user)} that their song was rejected...`);
      const builder = new StringBuilder();
      builder.push(":persevere:\nI'm very sorry. Your earlier submission was rejected: ");
      builder.push(entry.url);

      await sendPrivately(user, builder.result());

      if (await guildStorage.isQueueOpen()) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await sendPrivately(user, "You can resubmit another song if you'd like to. :slight_smile:");
      }
      break;
    }

    default:
      break;
  }
}
