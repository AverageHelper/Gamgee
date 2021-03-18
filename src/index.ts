import "source-map-support/register";
import "./environment";
import { useLogger } from "./logger";
import { useStorage } from "./configStorage";
import Discord from "discord.js";
import { handleCommand } from "./commands";

const logger = useLogger();

try {
  const client = new Discord.Client();

  client.on("ready", () => {
    logger.info(`Logged in as ${client.user?.tag ?? "nobody right now"}!`);
  });

  client.on("message", msg => {
    void useStorage(msg.guild)
      .then(storage => handleCommand(client, msg, storage))
      .catch(error =>
        logger.error(`Failed to handle command: ${JSON.stringify(error, undefined, 2)}`)
      );
  });

  void client.login(process.env.DISCORD_TOKEN);

  // Handle top-level errors
} catch (error) {
  logger.error(error);
}
