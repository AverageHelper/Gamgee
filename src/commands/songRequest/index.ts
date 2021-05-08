import type { Command } from "../Command";
import { reject_public } from "./actions";

import urlRequest from "./urlRequest";
import info from "./info";
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
  info,
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
  name: "sr",
  description: "Submit a song to the queue.",
  options: [...namedSubcommands, urlRequest],
  async execute(context) {
    // Prepare arguments
    const arg: string | undefined = context.options[0]?.name;
    const argOptions = context.options[0]?.options;
    if (arg === undefined || arg === "" || !argOptions) {
      return reject_public(context, "You're gonna have to add a song link to that.");
    }

    for (const command of namedSubcommands) {
      if (command.name === arg) {
        context.options = argOptions;
        return command.execute(context);
      }
    }

    // An unnamed command in message mode
    return urlRequest.execute(context);
  }
};

export default sr;
