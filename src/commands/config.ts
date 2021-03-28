import type { Command } from "./Command";
import { SAFE_PRINT_LENGTH } from "../constants/output";
import { isConfigKey, isConfigValue } from "../constants/config";
import { listKeys } from "../constants/config/keys";
import { getConfigValue } from "../actions/config/getConfigValue";
import { setConfigValue } from "../actions/config/setConfigValue";
import { replyPrivately } from "../actions/messages";
import { useLogger } from "../logger";

const logger = useLogger();

const ARG_GET = "get";
const ARG_SET = "set";
const ARG_UNSET = "unset";
const ARG_HELP = "help";

const allSubargs = [ARG_GET, ARG_SET, ARG_UNSET, ARG_HELP];
const subargsList = allSubargs.map(v => `\`${v}\``).join(", ");

type Argument = typeof ARG_GET | typeof ARG_SET | typeof ARG_UNSET | typeof ARG_HELP;

function isArgument(toBeDetermined: unknown): toBeDetermined is Argument {
  return (
    Boolean(toBeDetermined) &&
    typeof toBeDetermined === "string" &&
    allSubargs.includes(toBeDetermined)
  );
}

const config: Command = {
  name: "config",
  description: "Read and modify config options. *(Server owner only. No touch!)*",
  async execute(context) {
    const { message, args, storage } = context;
    async function reply(body: string): Promise<void> {
      await message.reply(body);
    }

    if (!message.guild) {
      return reply("Can't do that here.");
    }

    // Only the guild owner may touch the config.
    if (message.author.id !== message.guild.ownerID) {
      await replyPrivately(message, "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }

    const arg = args[0]?.toLowerCase();
    if (arg === undefined || arg === "") {
      return reply(`Missing command structure. Expected ${subargsList}`);
    }
    if (!isArgument(arg)) {
      return reply(`I don't know what to do with that. I expected one of ${subargsList}`);
    }

    switch (arg) {
      case ARG_GET: {
        // Get stuff
        const key = args[1];
        if (key === undefined || key === "") {
          return reply(listKeys());
        }

        if (isConfigKey(key)) {
          const value = await getConfigValue(storage, key);
          return reply(`**${key}**: ${JSON.stringify(value)}`);
        }

        const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
        return reply(`I'm not sure what ${that} is. Try one of ${listKeys()}`);
      }

      case ARG_UNSET: {
        // Delete stuff
        const key = args[1];
        if (key === undefined || key === "") {
          return reply(listKeys());
        }

        if (isConfigKey(key)) {
          await setConfigValue(storage, key, undefined);
          const value = await getConfigValue(storage, key);
          return reply(`**${key}** reset to ${JSON.stringify(value)}`);
        }

        const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
        return reply(`I'm not sure what ${that} is. Try one of ${listKeys()}`);
      }

      case ARG_SET: {
        // Set stuff
        const key = args[1];
        if (key === undefined || key === "") {
          return reply(listKeys());
        }

        if (!isConfigKey(key)) {
          const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
          return reply(`I'm not sure what ${that} is. Try one of ${listKeys()}`);
        }

        const value = args[2];
        if (value === undefined || value === "") {
          return reply("Expected a value to set.");
        }
        if (!isConfigValue(value)) {
          return reply("Invalid value type.");
        }
        await setConfigValue(storage, key, value);
        return reply(`**${key}**: ${JSON.stringify(value)}`);
      }

      case ARG_HELP:
        // List all the keys
        logger.debug("Received 'config help' command.");
        return reply(listKeys());
    }
  }
};

export default config;
