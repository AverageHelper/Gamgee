import "source-map-support/register";
import "./environment";
import { useLogger } from "./logger";
import { useStorage } from "./configStorage";
import Discord from "discord.js";
import { handleCommand } from "./commands";

const logger = useLogger();
logger.debug(`Starting in ${process.env.NODE_ENV ?? "undefined"} environment`);

try {
  const client = new Discord.Client();

  client.on("ready", () => {
    logger.info(`Logged in as ${client.user?.tag ?? "nobody right now"}!`);

    // TODO: Set own status to Active
    // TODO: On exit in prod mode, set own status to Offline
  });

  client.on("message", msg => {
    void useStorage(msg.guild)
      .then(storage => handleCommand(client, msg, storage))
      .catch(error =>
        logger.error(`Failed to handle command: ${JSON.stringify(error, undefined, 2)}`)
      );
  });

  client.on("messageReactionAdd", (reaction, user) => {
    if (reaction.me) return; // Ignore self reaction

    // TODO: If reaction is :x: and the message is a queue message, mark that queue entry as "ignored"
    logger.info(
      `User ${user.id} (${user.username ?? "null"}) reacted with :${
        reaction.emoji.identifier
      }: on message ${reaction.message.id} in channel ${reaction.message.channel.id} in guild ${
        reaction.message.guild?.id ?? "(null)"
      }`
    );
  });

  client.on("messageReactionRemove", (reaction, user) => {
    if (reaction.me) return; // Ignore self reaction

    // TODO: If reaction is :x: and the message is a queue message, unignore that queue entry
    logger.info(
      `User ${user.id} (${user.username ?? "null"}) removed a reaction on message ${
        reaction.message.id
      } in channel ${reaction.message.channel.id} in guild ${
        reaction.message.guild?.id ?? "(null)"
      }`
    );
  });

  void client.login(process.env.DISCORD_TOKEN);

  // Handle top-level errors
} catch (error) {
  logger.error(error);
}
