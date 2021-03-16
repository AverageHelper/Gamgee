import "source-map-support/register";
import "./environment";
import { useStorage } from "./storage";
import Discord from "discord.js";
import { handleCommand } from "./commands";

const client = new Discord.Client();

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag ?? "nobody right now"}!`);
  void useStorage()
    .then(() => console.log("Initialized local storage"))
    .catch(error => console.error("Failed to initialize local storage:", error));
});

client.on("message", msg => {
  void useStorage().then(storage => handleCommand(msg, storage));
});

void client.login(process.env.DISCORD_TOKEN);
