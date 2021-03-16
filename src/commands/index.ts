import type { Storage } from "../storage";
import Discord from "discord.js";
import getUserFromMention from "../helpers/getUserFromMention";
import { getConfigCommandPrefix } from "../actions/config/getConfigValue";
import config from "./config";
import ping from "./ping";
import yt from "./yt";

export interface Command {
  name: string;
  description: string;
  execute: (context: CommandContext) => void | Promise<void>;
}

export interface CommandContext {
  client: Discord.Client;
  message: Discord.Message;
  args: string[];
  storage: Storage;
}

const commands = new Discord.Collection<string, Command>();
[config, ping, yt].forEach(command => {
  commands.set(command.name, command);
});

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
  storage: Storage
): Promise<Array<string> | undefined> {
  const content = message.content.trim();
  console.log(`Received message: '${content}'`);
  const query = content.split(/ +/);

  const commandOrMention = query[0];
  console.log(`First word: '${commandOrMention}'`);

  const mentionedUser = await getUserFromMention(message, commandOrMention);
  if (mentionedUser) {
    console.log("This mentions", mentionedUser.username);
    // See if it's for us.
    if (client.user && mentionedUser.tag === client.user.tag) {
      console.log("This is us!", client.user.tag);
      // It's for us. Return the query verbatim.
      return query.slice(1);
    }

    // It's not for us.
    console.log("This is not us.", client.user?.tag ?? "We're not signed in.");
    return undefined;
  }

  // Make sure it's a command
  const COMMAND_PREFIX = await getConfigCommandPrefix(storage);
  console.log(`This is not a mention. Checking for the prefix '${COMMAND_PREFIX}'`);
  if (!content.startsWith(COMMAND_PREFIX)) {
    console.log("This is just a message. Ignoring.");
    return undefined;
  }
  query[0] = query[0].substring(COMMAND_PREFIX.length);
  console.log("query:", query);

  return query;
}

/**
 * Performs actions from a Discord message. The command is ignored if the message is from a bot or the message does
 * not begin with the configured command prefix.
 *
 * @param message The Discord message to handle.
 * @param storage Arbitrary persistent storage.
 */
export async function handleCommand(
  client: Discord.Client,
  message: Discord.Message,
  storage: Storage
): Promise<void> {
  // Don't respond to bots
  if (message.author.bot) return;

  // Don't bother with empty messages
  const content = message.content.trim();
  if (!content) return;

  // Don't bother with regular messages
  const q = await query(client, message, storage);
  if (!q) return;

  // Get the command
  const commandName = q[0].toLowerCase();
  const command = commands.get(commandName);

  if (command) {
    console.log(`Received command '${q[0]}' with args [${q.slice(1).join(", ")}]`);

    const args = q.slice(1);

    const context: CommandContext = {
      client,
      message,
      args,
      storage
    };
    return command.execute(context);
  }

  console.log(`Received invalid command '${commandName}' with args [${q.slice(1).join(", ")}]`);
  await message.reply("Invalid command");
}
