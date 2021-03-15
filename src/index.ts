import "source-map-support/register";
import Discord from "discord.js";
const client = new Discord.Client();

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag ?? "nobody right now"}!`);
});

client.on("message", msg => {
  if (msg.author.bot) return;

  if (msg.content === "!ping") {
    void msg.reply("Pong!");
  }
});

void client.login(process.env.DISCORD_TOKEN);
