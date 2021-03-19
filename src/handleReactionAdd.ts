import type Discord from "discord.js";
import { useLogger } from "./logger";

const logger = useLogger();

export async function handleReactionAdd(
  reaction: Discord.MessageReaction,
  user: Discord.User | Discord.PartialUser
): Promise<void> {
  // TODO: Handle reaction adds here. These might trigger actions on registered messages. Some of these actions will share behavior with reaction removals, but the reaction counts should remain consistent.

  // TODO: If reaction is :x: and the message is a queue message, mark that queue entry as "ignored"
  logger.info(
    `User ${user.id} (${user.username ?? "null"}) reacted with :${
      reaction.emoji.identifier
    }: on message ${reaction.message.id} in channel ${reaction.message.channel.id} in guild ${
      reaction.message.guild?.id ?? "(null)"
    }`
  );
  return Promise.resolve();
}
