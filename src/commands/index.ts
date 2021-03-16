import type { Storage } from "../storage";
import type Discord from "discord.js";
import { getConfigCommandPrefix } from "../actions/config/getConfigValue";
import config from "./config";
import pong from "./pingResponse";
import yt from "./yt";

interface PartialContext {
  client: Discord.Client;
  message: Discord.Message;
  command: string[];
  storage: Storage;
}

export interface CommandContext {
  client: Discord.Client;
  message: Discord.Message;
  command: string;
  params: string[];
  storage: Storage;
}

function run(
  context: PartialContext,
  handler: (context: CommandContext) => Promise<string>
): Promise<string>;
function run(context: PartialContext, handler: (context: CommandContext) => string): string;

function run(
  runContext: PartialContext,
  handler: (context: CommandContext) => Promise<string> | string
): Promise<string> | string {
  const { command, client, message, storage } = runContext;
  console.log(`Received command '${command.join(" ")}'`);

  const params = command.slice();
  const cmd = params.shift() ?? "";

  const context: CommandContext = {
    client,
    message,
    command: cmd,
    params,
    storage
  };
  const response = handler(context);
  if (response instanceof Promise) {
    return response.then(response => {
      console.log(`Response: '${response}'`);
      return response;
    });
  }

  console.log(`Response: '${response}'`);
  return response;
}

/**
 * Performs actions from a Discord message. The command is ignored if the message is from a bot or the message does
 * not begin with the configured command prefix.
 *
 * @param msg The Discord message to handle.
 * @param storage Arbitrary persistent storage.
 */
export async function handleCommand(
  client: Discord.Client,
  msg: Discord.Message,
  storage: Storage
): Promise<void> {
  if (msg.author.bot) return;
  if (!msg.content) return;
  const COMMAND_PREFIX = await getConfigCommandPrefix(storage);
  if (!msg.content.startsWith(COMMAND_PREFIX)) return;

  // TODO: Parse the command more smartly
  const command = msg.content.trim().substring(COMMAND_PREFIX.length).split(" ");
  const runContext: PartialContext = {
    client,
    message: msg,
    command,
    storage
  };

  switch (command[0].toLowerCase()) {
    case "config":
      await msg.reply(await run(runContext, config));
      break;

    case "ping":
      await run(runContext, pong);
      break;

    case "yt":
      await msg.reply(await run(runContext, yt));
      break;

    default:
      console.log(`Received invalid command '${command.join(" ")}'`);
      await msg.reply("Invalid command");
  }
}
