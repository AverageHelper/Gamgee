import "source-map-support/register";
import "./environment";
import { useLogger } from "./logger";
import { useStorage } from "./storage";
import Discord from "discord.js";
import { handleCommand } from "./commands";

const logger = useLogger();

try {
  const client = new Discord.Client();

  client.on("ready", () => {
    logger.info(`Logged in as ${client.user?.tag ?? "nobody right now"}!`);
    void useStorage()
      .then(() => logger.debug("Initialized local storage"))
      .catch(error => logger.error("Failed to initialize local storage:", error));
  });

  client.on("message", msg => {
    void useStorage()
      .then(storage => handleCommand(client, msg, storage))
      .catch(error => logger.error("Failed to handle command:", error));
  });

  void client.login(process.env.DISCORD_TOKEN);

  // Handle top-level errors
} catch (error) {
  logger.error(error);
}
