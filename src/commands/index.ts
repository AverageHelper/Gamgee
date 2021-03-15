import type Discord from "discord.js";
import yt from "./yt";

export const COMMAND_PREFIX = "!";

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

export async function handleCommand(msg: Discord.Message): Promise<void> {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(COMMAND_PREFIX)) return;

  // TODO: Parse the command more smartly
  const command = msg.content.substring(1).split(" ");

  switch (command[0].toLowerCase()) {
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
