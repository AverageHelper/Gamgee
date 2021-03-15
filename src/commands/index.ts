import type Discord from "discord.js";
import yt from "./yt";

export const COMMAND_PREFIX = "!";

export async function handleCommand(msg: Discord.Message): Promise<void> {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(COMMAND_PREFIX)) return;
  const command = msg.content.substring(1).split(" ");

  switch (command[0].toLowerCase()) {
    case "ping":
      console.log(`Received command '${command.join(" ")}'`);
      await msg.reply("Pong!");
      console.log(`Response: 'Pong!'`);
      break;

    case "yt": {
      console.log(`Received command '${command.join(" ")}'`);
      const params = command.slice();
      params.shift();
      const response = await yt(params);

      await msg.reply(response);
      console.log(`Response: '${response}'`);
      break;
    }

    default:
      console.log(`Received invalid command '${command.join(" ")}'`);
      await msg.reply("Invalid command");
  }
}
