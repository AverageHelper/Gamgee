import "source-map-support/register";
import "reflect-metadata";
import { getEnv, requireEnv } from "./helpers/environment";
import { useLogger } from "./logger";

const logger = useLogger();
logger.info("Starting...");
logger.debug(`env: ${getEnv("NODE_ENV") ?? "undefined"}`);

import Discord from "discord.js";
import richErrorMessage from "./helpers/richErrorMessage";
import { useStorage } from "./configStorage";
import { handleCommand } from "./handleCommand";
import { handleReactionAdd } from "./handleReactionAdd";

async function onNewMessage(
  client: Discord.Client,
  msg: Discord.Message | Discord.PartialMessage
): Promise<void> {
  try {
    const message = await msg.fetch();
    const storage = await useStorage(message.guild, logger);
    await handleCommand(client, message, storage, logger);
  } catch (error: unknown) {
    const msgDescription = JSON.stringify(msg, undefined, 2);
    logger.error(richErrorMessage(`Failed to handle message: ${msgDescription}`, error));
  }
}

async function onMessageReactionAdd(
  rxn: Discord.MessageReaction,
  usr: Discord.User | Discord.PartialUser
): Promise<void> {
  try {
    const [reaction, user] = await Promise.all([rxn.fetch(), usr.fetch()]);
    await handleReactionAdd(reaction, user, logger);
  } catch (error: unknown) {
    logger.error(richErrorMessage("Failed to handle reaction add.", error));
  }
}

try {
  const client = new Discord.Client({ partials: ["REACTION", "CHANNEL", "MESSAGE"] });

  // Handle client events
  client.on("ready", () => {
    logger.info(`Logged in as ${client.user?.tag ?? "nobody right now"}!`);
  });

  client.on("error", error => {
    logger.error(richErrorMessage("Received client error.", error));
  });

  client.on("message", msg => {
    void onNewMessage(client, msg);
  });

  client.on("messageReactionAdd", (reaction, user) => {
    void onMessageReactionAdd(reaction, user);
  });

  // Log in
  void client.login(requireEnv("DISCORD_TOKEN"));

  // Handle top-level errors
} catch (error: unknown) {
  logger.error(richErrorMessage("Something bad has happened and we had to stop a command.", error));
}
