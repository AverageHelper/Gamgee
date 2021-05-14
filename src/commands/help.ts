import type { GlobalCommand } from "./Command";
import describeAllCommands from "../actions/describeAllCommands";

const help: GlobalCommand = {
  name: "help",
  description: "Print a handy help message.",
  requiresGuild: false,
  async execute(context) {
    // Dynamic import here, b/c ./index depends on us to resolve
    const { allCommands } = await import("./index");

    const descriptions = await describeAllCommands(context, allCommands);
    return context.replyPrivately(`Commands:\n${descriptions}`);
  }
};

export default help;
