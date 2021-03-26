import "source-map-support/register";
import { getEnv, requireEnv } from "./helpers/environment";
import { useLogger } from "./logger";
import isError from "./helpers/isError";

const logger = useLogger();
logger.info("Starting...");
logger.debug(`env: ${getEnv("NODE_ENV") ?? "undefined"}`);

import Discord from "discord.js";
import { useStorage } from "./configStorage";
import { handleCommand } from "./handleCommand";
import { handleReactionAdd } from "./handleReactionAdd";
import StringBuilder from "./helpers/StringBuilder";

function richErrorMessage(preamble: string, error: unknown): string {
  const messageBuilder = new StringBuilder(preamble);
  messageBuilder.pushNewLine();

  if (isError(error)) {
    messageBuilder.push(`${error.name}: ${error.message}`);
    if (error.code !== undefined) {
      messageBuilder.push(` (${error.code})`);
    }
    if (error.stack !== undefined) {
      messageBuilder.push(",\nStack: ");
      messageBuilder.push(error.stack);
    }
  } else {
    messageBuilder.push("Error: ");
    messageBuilder.push(JSON.stringify(error));
  }

  return messageBuilder.result();
}

async function onNewMessage(
  client: Discord.Client,
  msg: Discord.Message | Discord.PartialMessage
): Promise<void> {
  try {
    const message = await msg.fetch();
    const storage = await useStorage(message.guild);
    await handleCommand(client, message, storage);
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
    await handleReactionAdd(reaction, user);
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
