import type { Command } from "./Command";
import { version as gamgeeVersion } from "../version";

const version: Command = {
  name: "version",
  description: "Display the bot's current codebase version.",
  async execute({ message }) {
    await message.channel.send(`I'm currently running Gamgee Core v${gamgeeVersion}.`);
  }
};

export default version;
