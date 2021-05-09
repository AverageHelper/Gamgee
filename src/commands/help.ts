import type { Command } from "./Command";
import Discord from "discord.js";
import describeAllCommands from "../actions/describeAllCommands";

const help: Command = {
  name: "help",
  description: "Print a handy help message.",
  async execute({ storage, replyPrivately }) {
    // Dynamic import here, b/c ./index depends on us to resolve
    const commandDefinitions = await import("./index");

    const commands = new Discord.Collection<string, Command>();
    Object.values(commandDefinitions).forEach(command => {
      commands.set(command.name, command);
    });

    const descriptions = await describeAllCommands(storage, commands);
    return replyPrivately(`Commands:\n${descriptions}`);
  }
};

export default help;
