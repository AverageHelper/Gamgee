import "source-map-support/register";
import dotenv from "dotenv";
import Discord from "discord.js";
import { handleCommand } from "./commands";

dotenv.config();
// TODO: Set up persistent storage, pass this to the command handler
const client = new Discord.Client();

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag ?? "nobody right now"}!`);
});

client.on("message", msg => {
  void handleCommand(msg);
});

void client.login(process.env.DISCORD_TOKEN);
