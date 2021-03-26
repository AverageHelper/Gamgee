import type { Storage } from "./configStorage";
import Discord from "discord.js";
import getUserFromMention from "./helpers/getUserFromMention";
import { getEnv } from "./helpers/environment";
import { getConfigCommandPrefix } from "./actions/config/getConfigValue";
import { useLogger } from "./logger";
import { randomGreeting, randomPhrase, randomQuestion } from "./helpers/randomStrings";
import type { Command } from "./commands";
import * as commandDefinitions from "./commands";

const LOGGING = false;
const logger = useLogger();

function debugLog(msg: string): void {
  if (LOGGING) logger.debug(msg);
}

const commands = new Discord.Collection<string, Command>();
Object.values(commandDefinitions).forEach(command => {
  commands.set(command.name, command);
});

interface QueryMessage {
  /** The command and its arguments. */
  query: Array<string>;
  /** Whether the user used the regular command prefix or a user mention. */
  usedCommandPrefix: boolean;
}

/**
 * Parses a message and returns a command query if one exists.
 *
 * If the message starts with a ping to the bot, then we assume no command prefix
 * and return the message verbatim as a query. Otherwise, we check the first word
 * for the command prefix. If that exists, then the prefix is trimmed and the message
 * is returned as a query.
 *
 * Non-query messages will resolve to an `undefined` query, and should be ignored.
 *
 * @param client The Discord client.
 * @param message The message to parse.
 * @param storage The bot's persistent storage.
 *
 * @returns The command query. The first argument is the command name, and the rest are arguments.
 */
async function query(
  client: Discord.Client,
  message: Discord.Message,
  storage: Storage | null
): Promise<QueryMessage | null> {
  const content = message.content.trim();
  debugLog(`Received message: '${content}'`);
  const query = content.split(/ +/u);

  const commandOrMention = query[0];
  if (commandOrMention === undefined || commandOrMention === "") return null;
  debugLog(`First word: '${commandOrMention}'`);

  const mentionedUser = await getUserFromMention(message, commandOrMention);
  if (mentionedUser) {
    debugLog(`This mentions ${mentionedUser.tag}`);
    // See if it's for us.
    if (client.user && mentionedUser.tag === client.user.tag) {
      debugLog(`This is us! ${client.user.tag}`);
      // It's for us. Return the query verbatim.
      return { query: query.slice(1), usedCommandPrefix: false };
    }

    // It's not for us.
    debugLog(`This is not us. ${client.user?.tag ?? "We're not signed in."}`);
    return null;
  }

  // Make sure it's a command
  const COMMAND_PREFIX = await getConfigCommandPrefix(storage);
  debugLog(`This is not a mention. Checking for the prefix '${COMMAND_PREFIX}'`);
  if (!content.startsWith(COMMAND_PREFIX)) {
    debugLog("This is just a message. Ignoring.");
    return null;
  }
  query[0] = query[0]?.slice(COMMAND_PREFIX.length) ?? "";
  debugLog(`query: ${query.toString()}`);

  return { query, usedCommandPrefix: true };
}

/**
 * Performs actions from a Discord message. The command is ignored if the message is from a bot or the message does
 * not begin with the configured command prefix.
 *
 * @param client The Discord client.
 * @param message The Discord message to handle.
 * @param storage Arbitrary persistent storage.
 */
export async function handleCommand(
  client: Discord.Client,
  message: Discord.Message,
  storage: Storage | null
): Promise<void> {
  // Don't respond to bots unless we're being tested
  if (message.author.bot && getEnv("NODE_ENV") !== "test") {
    logger.silly(
      `Momma always said not to talk to strangers. They could be *bots*. bot: ${
        message.author.bot ? "true" : "false"
      }; env: ${getEnv("NODE_ENV") ?? "undefined"}`
    );
    return;
  }
  debugLog(
    `Handling a message. bot: ${message.author.bot ? "true" : "false"}; env: ${
      getEnv("NODE_ENV") ?? "undefined"
    }`
  );

  // Ignore self messages
  if (message.author.id === message.client.user?.id) return;

  // Don't bother with empty messages
  const content = message.content.trim();
  if (!content) return;

  // Don't bother with regular messages
  const pq = await query(client, message, storage);
  if (!pq) return;
  const { query: q, usedCommandPrefix } = pq;

  logger.info(`Received command '${q[0] ?? ""}' with args [${q.slice(1).join(", ")}]`);

  if (q.length === 0) {
    // This is a query for us to handle (we might've been pinged), but it's empty.
    await message.reply(randomQuestion());
    return;
  }

  // Get the command
  const commandName = q[0]?.toLowerCase();

  if (commandName === undefined || commandName === "") {
    // Empty, so do nothing lol
    return;
  }

  const command = commands.get(commandName);
  if (command) {
    const args = q.slice(1);
    return command.execute({
      client,
      message,
      args,
      storage
    });
  }

  logger.debug(`Received invalid command '${commandName}' with args [${q.slice(1).join(", ")}]`);

  if (!usedCommandPrefix) {
    void message.channel.startTyping();
    await new Promise(resolve => setTimeout(resolve, 1000));
    // This is likely a game. Play along!
    if (q.map(s => s.toLowerCase()).includes("hello")) {
      await message.channel.send(randomGreeting());
    } else {
      await message.channel.send(randomPhrase());
    }
    void message.channel.stopTyping();
  }
}
