import type { Command } from "../Command";
import StringBuilder from "../../helpers/StringBuilder";
import setup from "./setup";
import teardown from "./teardown";
import blacklist from "./blacklist";
import whitelist from "./whitelist";
import open from "./open";
import close from "./close";
import limit from "./limit";
import stats from "./stats";
import restart from "./restart";

const namedSubcommands = [
  setup,
  teardown,
  blacklist,
  whitelist,
  open,
  close,
  limit,
  stats,
  restart
];

const sr: Command = {
  name: "queue",
  description: "Submit a song to the queue.",
  options: namedSubcommands,
  async execute(context) {
    const arg: string | undefined = context.options[0]?.name;
    const argOptions = context.options[0]?.options;
    if (arg === undefined || arg === "" || !argOptions) {
      const response = new StringBuilder("The possible subcommands are:");
      Object.keys(namedSubcommands).forEach(commandName => {
        response.pushNewLine();
        response.push(" - ");
        response.pushCode(commandName);
      });

      return context.reply(response.result());
    }

    for (const command of namedSubcommands) {
      if (command.name === arg) {
        context.options = argOptions;
        return command.execute(context);
      }
    }

    // Unknown command. Leave it be
  }
};

export default sr;
