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
    if (error.code) {
      messageBuilder.push(` (${error.code})`);
    }
    if (error.stack) {
      messageBuilder.push(",\nStack: ");
      messageBuilder.push(error.stack);
    }
  } else {
    messageBuilder.push("Error: ");
    messageBuilder.push(JSON.stringify(error));
  }

  return messageBuilder.result();
}

try {
  const client = new Discord.Client({ partials: ["REACTION", "CHANNEL", "MESSAGE"] });

  // Handle client states
  client.on("ready", () => {
    logger.info(`Logged in as ${client.user?.tag ?? "nobody right now"}!`);
  });

  client.on("error", error => {
    logger.error(richErrorMessage("Received client error.", error));
  });

  // Handle messages
  client.on("message", msg => {
    void msg.fetch().then(msg =>
      useStorage(msg.guild)
        .then(storage => handleCommand(client, msg, storage))
        .catch(error =>
          logger.error(
            richErrorMessage(
              `Failed to handle message: ${JSON.stringify(msg, undefined, 2)}`,
              error
            )
          )
        )
    );
  });

  // Handle Reactions
  client.on("messageReactionAdd", (reaction, user) => {
    void Promise.all([reaction.fetch(), user.fetch()])
      .then(([reaction, user]) => handleReactionAdd(reaction, user))
      .catch(error => logger.error(richErrorMessage("Failed to handle reaction add.", error)));
  });

  // Log in
  void client.login(requireEnv("DISCORD_TOKEN"));

  // Handle top-level errors
} catch (error: unknown) {
  logger.error(richErrorMessage("Something bad has happened and we had to stop a command.", error));
}
