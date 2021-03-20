import type Discord from "discord.js";
// import { useLogger } from "./logger";
import { useQueue } from "./actions/queue/useQueue";
import { REACTION_BTN_DONE, REACTION_BTN_UNDO } from "./constants/reactions";

// const logger = useLogger();

export async function handleReactionAdd(
  reaction: Discord.MessageReaction,
  user: Discord.User | Discord.PartialUser
): Promise<void> {
  const message = reaction.message;

  // Only the guild owner may touch the config.
  // FIXME: Add more grannular access options
  if (!message.guild?.owner?.user.tag || user.tag !== message.guild.owner.user.tag) {
    return;
  }

  if (!reaction.message.channel.isText()) return;
  const channel = reaction.message.channel as Discord.TextChannel;
  const queue = await useQueue(channel);
  const entry = await queue.getEntryFromMessage(message.id);

  if (entry) {
    // Mark done
    if (reaction.emoji.name === REACTION_BTN_DONE) {
      await queue.markDone(message);

      // Mark undone
    } else if (reaction.emoji.name === REACTION_BTN_UNDO) {
      await queue.markNotDone(message);
    }
  }

  return Promise.resolve();
}
