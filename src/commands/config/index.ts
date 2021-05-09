import type { Command } from "../Command";

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
  options: namedSubcommands,
  async execute(context) {
    const { guild, user, options, reply, replyPrivately } = context;

    if (!guild) {
      return reply("Can't do that here.");
    }

    // Only the guild owner may touch the config.
    if (user.id !== guild.ownerID) {
      await replyPrivately("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }

    const arg: string | undefined = options[0]?.name ?? (options[0]?.value as string | undefined);
    const argOptions = options[0]?.options ?? [];
    if (arg === undefined || arg === "") {
      return reply(`Missing command structure. Expected ${subargsList}`);
    }

    context.logger.debug(
      `Searching ${
        namedSubcommands.length
      } possible subcommands for one named '${arg}': ${JSON.stringify(
        namedSubcommands.map(c => c.name),
        undefined,
        2
      )}`
    );
    for (const command of namedSubcommands) {
      if (command.name === arg) {
        context.options = argOptions;
        context.logger.debug(
          `Handling subcommand '${command.name}' with options: ${JSON.stringify(
            context.options,
            undefined,
            2
          )}`
        );
        return command.execute(context);
      }
    }

    return reply(`I don't know what to do with that. I expected one of ${subargsList}`);
  }
};

export default config;
