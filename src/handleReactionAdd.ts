import type Discord from "discord.js";
import { useLogger } from "./logger";
import { useQueue } from "./actions/queue/useQueue";
import { REACTION_BTN_DONE, REACTION_BTN_UNDO } from "./constants/reactions";

const logger = useLogger();

export async function handleReactionAdd(
  reaction: Discord.MessageReaction,
  user: Discord.User
): Promise<void> {
  if (user.bot) return; // Ignore bot reactions

  logger.debug("Received user reaction.");
  const message = reaction.message;

  if (!reaction.message.channel.isText()) return;
  const channel = reaction.message.channel as Discord.TextChannel;
  const queue = await useQueue(channel);
  const entry = await queue.getEntryFromMessage(message.id);

  if (entry) {
    logger.debug(
      `Got entry from message ${entry.queueMessageId} (${entry.isDone ? "Done" : "Not done"})`
    );

    // Only the guild owner may touch the config.
    // FIXME: Add more grannular access options
    if (!message.guild?.owner?.user.tag || user.tag !== message.guild.owner.user.tag) {
      logger.debug(`Unauthorized user ${user.id} reacted to a message.`);
      return;
    }

    // Mark done
    if (reaction.emoji.name === REACTION_BTN_DONE) {
      logger.debug("Marking done....");
      await queue.markDone(message);
      logger.debug("Marked done.");

      // Mark undone
    } else if (reaction.emoji.name === REACTION_BTN_UNDO) {
      logger.debug("Marking undone....");
      await queue.markNotDone(message);
      logger.debug("Marked undone");
    }
  }

  return Promise.resolve();
}
