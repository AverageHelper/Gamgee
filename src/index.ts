import "source-map-support/register";
import "./environment";
import { useLogger } from "./logger";
import { useStorage } from "./configStorage";
import Discord from "discord.js";
import { handleCommand } from "./handleCommand";
import { handleReactionAdd } from "./handleReactionAdd";
import { handleReactionRemove } from "./handleReactionRemove";

const logger = useLogger();
logger.debug(`Starting in ${process.env.NODE_ENV ?? "undefined"} environment`);

try {
  const client = new Discord.Client();

  // Handle client states
  client.on("ready", () => {
    logger.info(`Logged in as ${client.user?.tag ?? "nobody right now"}!`);

    void client.user
      ?.setStatus("online")
      .catch(error =>
        logger.error(`Failed to set status to 'online': ${JSON.stringify(error, undefined, 2)}`)
      );
    // TODO: On exit in prod mode, set own status to Offline
  });

  client.on("error", error => {
    logger.error(`Received client error: ${JSON.stringify(error, undefined, 2)}`);
  });

  // Handle messages
  client.on("message", msg => {
    void useStorage(msg.guild)
      .then(storage => handleCommand(client, msg, storage))
      .catch(error =>
        logger.error(`Failed to handle command: ${JSON.stringify(error, undefined, 2)}`)
      );
  });

  // Handle Reactions
  client.on("messageReactionAdd", (reaction, user) => {
    if (reaction.me) return; // Ignore self reaction

    void handleReactionAdd(reaction, user).catch(error =>
      logger.error(`Failed to handle reaction add: ${JSON.stringify(error, undefined, 2)}`)
    );
  });

  client.on("messageReactionRemove", (reaction, user) => {
    if (reaction.me) return; // Ignore self reaction

    void handleReactionRemove(reaction, user).catch(error =>
      logger.error(`Failed to handle reaction remove: ${JSON.stringify(error, undefined, 2)}`)
    );
  });

  // Log in
  void client.login(process.env.DISCORD_TOKEN);

  // Handle top-level errors
} catch (error) {
  logger.error(error);
}
