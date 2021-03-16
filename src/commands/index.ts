import type { Storage } from "../storage";
import type Discord from "discord.js";
import config from "./config";
import yt from "./yt";
import { getConfigCommandPrefix } from "../actions/config/getConfigValue";

function run(command: string[], handler: (params: string[]) => Promise<string>): Promise<string>;
function run(command: string[], handler: (params: string[]) => string): string;

function run(
  command: string[],
  handler: (params: string[]) => Promise<string> | string
): Promise<string> | string {
  console.log(`Received command '${command.join(" ")}'`);

  const params = command.slice();
  params.shift();

  const response = handler(params);
  if (response instanceof Promise) {
    return response.then(response => {
      console.log(`Response: '${response}'`);
      return response;
    });
  }

  console.log(`Response: '${response}'`);
  return response;
}

function runWithStorage(
  storage: Storage,
  command: string[],
  handler: (params: string[], storage: Storage) => Promise<string>
): Promise<string> {
  return run(command, params => handler(params, storage));
}

/**
 * Performs actions from a Discord message. The command is ignored if the message is from a bot or the message does
 * not begin with the configured command prefix.
 *
 * @param msg The Discord message to handle.
 * @param storage Arbitrary persistent storage.
 */
export async function handleCommand(msg: Discord.Message, storage: Storage): Promise<void> {
  if (msg.author.bot) return;
  if (!msg.content) return;
  const COMMAND_PREFIX = await getConfigCommandPrefix(storage);
  if (!msg.content.startsWith(COMMAND_PREFIX)) return;

  // TODO: Parse the command more smartly
  const command = msg.content.trim().substring(COMMAND_PREFIX.length).split(" ");

  switch (command[0].toLowerCase()) {
    case "config":
      await msg.reply(await runWithStorage(storage, command, config));
      break;

    case "ping":
      await msg.reply(run(command, () => "Pong!"));
      break;

    case "yt":
      await msg.reply(await run(command, yt));
      break;

    default:
      console.log(`Received invalid command '${command.join(" ")}'`);
      await msg.reply("Invalid command");
  }
}
