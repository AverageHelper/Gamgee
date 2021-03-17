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
  });

  client.on("message", msg => {
    void useStorage(msg.guild)
      .then(storage => {
        logger.debug(`Initialized local storage for guild ${msg.guild?.id ?? "null"}`);
        return handleCommand(client, msg, storage);
      })
      .catch(error => logger.error("Failed to handle command:", error));
  });

  void client.login(process.env.DISCORD_TOKEN);

  // Handle top-level errors
} catch (error) {
  logger.error(error);
}
