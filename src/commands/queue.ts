// import type Discord from "discord.js";
import type { Command } from "./index";
// import { getConfigQueueChannel } from "../actions/config/getConfigValue";
import { useLogger } from "../logger";

const logger = useLogger();

const ARG_START = "start";
const ARG_TOTAL_LIMIT = "total-limit";

const allSubargs = [ARG_START, ARG_TOTAL_LIMIT];
const subargsList = allSubargs.map(v => `\`${v}\``).join(", ");

type Argument = typeof ARG_START | typeof ARG_TOTAL_LIMIT;

const name = "queue";

const yt: Command = {
  name,
  description: "Manage a user queue.",
  uses: [
    [
      `${name} ${ARG_START} {channel name}`,
      "Tells me to use the channel called {channel name} for the queue. The previous queue will be forgotten."
    ],
    [
      `${name} ${ARG_TOTAL_LIMIT} {number}`,
      "Sets a default limit to the number of total submissions that any user may put in the queue."
    ]
  ],
  async execute(context) {
    const { message, args } = context;

    async function reject(reason: string) {
      await message.channel.send(reason);
    }

    if (args.length < 1) {
      return reject(`Missing command argument. Expected ${subargsList}`);
    }
    const command = args[0] as Argument;

    switch (command) {
      case ARG_START:
        logger.info("Should start a new queue.");
        return reject("This command will eventually set up a new queue.");

      case ARG_TOTAL_LIMIT:
        logger.info("Should set the default submission limit.");
        return reject("This command will eventually set a queue's per-user submission limit.");

      default:
        return reject(`Invalid command argument. Expected ${subargsList}`);
    }
  }
};

export default yt;
