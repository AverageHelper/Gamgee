import type { Command } from "./index";
import { SAFE_PRINT_LENGTH } from "../constants/output";
import { isConfigKey, isConfigValue } from "../constants/config";
import { listKeys } from "../constants/config/keys";
import { getConfigValue } from "../actions/config/getConfigValue";
import { setConfigValue } from "../actions/config/setConfigValue";
import { useLogger } from "../logger";

const logger = useLogger();

const ARG_GET = "get";
const ARG_SET = "set";
const ARG_UNSET = "unset";
const ARG_HELP = "help";

const allSubargs = [ARG_GET, ARG_SET, ARG_UNSET, ARG_HELP];
const subargsList = allSubargs.map(v => `\`${v}\``).join(", ");

type Argument = typeof ARG_GET | typeof ARG_SET | typeof ARG_UNSET | typeof ARG_HELP;

const config: Command = {
  name: "config",
  description: "Read and modify config options. *(Server owner only. No touch!)*",
  async execute(context) {
    const { message, args, storage } = context;
    async function reply(body: string) {
      await message.reply(body);
    }

    // Only the guild owner may touch the config.
    // FIXME: Add more grannular access options
    if (!message.guild?.owner?.user.tag || message.author.tag !== message.guild.owner.user.tag) {
      return reply("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
    }

    if (args.length < 1) {
      return reply(`Missing command structure. Expected ${subargsList}`);
    }

    const arg = args[0].toLowerCase() as Argument;

    switch (arg) {
      case ARG_GET: {
        // Get stuff
        if (args.length < 2) {
          return reply(listKeys());
        }

        const key = args[1];
        if (isConfigKey(key)) {
          const value = await getConfigValue(storage, key);
          return reply(`**${key}**: ${JSON.stringify(value)}`);
        }

        const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
        return reply(`I'm not sure what ${that} is. ` + listKeys());
      }

      case ARG_UNSET: {
        // Delete stuff
        if (args.length < 2) {
          return reply(listKeys());
        }

        const key = args[1];
        if (isConfigKey(key)) {
          await setConfigValue(storage, key, undefined);
          const value = await getConfigValue(storage, key);
          return reply(`**${key}** reset to ${JSON.stringify(value)}`);
        }

        const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
        return reply(`I'm not sure what ${that} is. ` + listKeys());
      }

      case ARG_SET: {
        // Set stuff
        if (args.length < 2) {
          return reply(listKeys());
        }

        const key = args[1];
        if (!isConfigKey(key)) {
          const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
          return reply(`I'm not sure what ${that} is. ` + listKeys());
        }

        const value = args[2];
        if (args.length < 3) {
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

      default:
        logger.info("Received invalid config command.");
        return reply(`I don't know what to do with that. I expected one of ${subargsList}`);
    }
  }
};

export default config;
