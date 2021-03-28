import type { Command } from "../Command";
import { reject_public } from "./actions";

import arbitrarySubcommand from "./urlRequest";
import info from "./info";
import setup from "./setup";
import teardown from "./teardown";
import open from "./open";
import close from "./close";
import limit from "./limit";
import stats from "./stats";
import restart from "./restart";

const namedSubcommands = [info, setup, teardown, open, close, limit, stats, restart];

const sr: Command = {
  name: "sr",
  description: "Submit a song to the queue.",
  namedSubcommands,
  arbitrarySubcommand,
  async execute(context) {
    const { message, args } = context;

    // Prepare arguments
    const arg = args[0];
    if (arg === undefined || arg === "") {
      return reject_public(message, "You're gonna have to add a song link to that.");
    }

    for (const command of namedSubcommands) {
      if (command.name === arg) {
        return command.execute(context);
      }
    }

    return arbitrarySubcommand.execute(context);
  }
};

export default sr;
