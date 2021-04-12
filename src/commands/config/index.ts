import type { Command } from "./../Command";
import { replyPrivately, replyWithMention } from "../../actions/messages";

import get from "./get";
import set from "./set";
import unset from "./unset";

const namedSubcommands = [get, set, unset];

const subargsList = namedSubcommands
  .map(c => c.name)
  .map(v => `\`${v}\``)
  .join(", ");

const config: Command = {
  name: "config",
  description: "Read and modify config options. *(Server owner only. No touch!)*",
  namedSubcommands,
  async execute(context) {
    const { message, args } = context;

    if (!message.guild) {
      return replyWithMention(message, "Can't do that here.");
    }

    // Only the guild owner may touch the config.
    if (message.author.id !== message.guild.ownerID) {
      await replyPrivately(message, "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }

    const arg = args[0]?.toLowerCase();
    if (arg === undefined || arg === "") {
      return replyWithMention(message, `Missing command structure. Expected ${subargsList}`);
    }

    for (const command of namedSubcommands) {
      if (command.name === arg) {
        return command.execute(context);
      }
    }

    return replyWithMention(
      message,
      `I don't know what to do with that. I expected one of ${subargsList}`
    );
  }
};

export default config;
