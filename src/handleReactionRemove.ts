import type Discord from "discord.js";
import { useLogger } from "./logger";

const logger = useLogger();

export async function handleReactionRemove(
  reaction: Discord.MessageReaction,
  user: Discord.User | Discord.PartialUser
): Promise<void> {
  // TODO: Handle reaction removals here. These might trigger actions on registered messages. Some of these actions will share behavior with reaction removals, but the reaction counts should remain consistent.

  // TODO: If reaction is :x: and the message is a queue message, unignore that queue entry
  logger.info(
    `User ${user.id} (${user.username ?? "null"}) removed a reaction on message ${
      reaction.message.id
    } in channel ${reaction.message.channel.id} in guild ${reaction.message.guild?.id ?? "(null)"}`
  );
  return Promise.resolve();
}
