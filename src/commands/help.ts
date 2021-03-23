import Discord from "discord.js";
import type { Command } from "./index";
import describeAllCommands from "../actions/describeAllCommands";

const help: Command = {
  name: "help",
  description: "Print this handy message.",
  async execute({ storage, message }) {
    // Dynamic import here, b/c ./index depends on us to resolve
    const commandDefinitions = await import("./index");

    const commands = new Discord.Collection<string, Command>();
    Object.values(commandDefinitions).forEach(command => {
      commands.set(command.name, command);
    });

    const descriptions = await describeAllCommands(storage, commands);
    await message.channel.send(`Commands:\n${descriptions}`);
  }
};

export default help;
