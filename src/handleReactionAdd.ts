import type Discord from "discord.js";
import { useLogger } from "./logger";
import { useQueue } from "./actions/queue/useQueue";
import { REACTION_BTN_DONE, REACTION_BTN_UNDO } from "./constants/reactions";

const logger = useLogger();

export async function handleReactionAdd(
  reaction: Discord.MessageReaction,
  user: Discord.User
): Promise<void> {
  // Ignore bot reactions unless we're being tested
  if (user.bot && process.env.NODE_ENV !== "test") {
    logger.silly(
      `Momma always said not to stare at strangers. It's rude. bot: ${
        user.bot ? "true" : "false"
      }; env: ${process.env.NODE_ENV ?? "undefined"}`
    );
    return;
  }
  logger.debug(
    `Handling a reaction. bot: ${user.bot ? "true" : "false"}; env: ${
      process.env.NODE_ENV ?? "undefined"
    }`
  );

  // Ignore self reactions
  if (user.id === reaction.client.user?.id) return;

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

    // Mark done
    if (reaction.emoji.name === REACTION_BTN_DONE) {
      logger.debug("Marking done....");
      await queue.markDone(message);
      logger.info("Marked an entry done.");

      // Mark undone
    } else if (reaction.emoji.name === REACTION_BTN_UNDO) {
      logger.debug("Marking undone....");
      await queue.markNotDone(message);
      logger.info("Marked an entry undone");
    }
  }

  return Promise.resolve();
}
