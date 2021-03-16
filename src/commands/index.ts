import type { Storage } from "../storage";
import Discord from "discord.js";
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
  if (!message.content) return;

  // Don't bother with regular messages
  const COMMAND_PREFIX = await getConfigCommandPrefix(storage);
  if (!content.startsWith(COMMAND_PREFIX)) return;

  // Get the command
  const query = content.substring(COMMAND_PREFIX.length).split(/ +/);
  const commandName = query[0].toLowerCase();
  const command = commands.get(commandName);

  if (command) {
    console.log(`Received command '${query[0]}' with args [${query.slice(1).join(", ")}]`);

    const args = query.slice(1);

    const context: CommandContext = {
      client,
      message,
      args,
      storage
    };
    return command.execute(context);
  }

  console.log(`Received invalid command '${commandName}' with args [${query.slice(1).join(", ")}]`);
  await message.reply("Invalid command");
}
