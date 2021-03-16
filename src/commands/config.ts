import type { Storage } from "../storage";
import { isConfigKey, isConfigValue } from "../constants/config";
import listKeys from "../actions/config/listKeys";
import { getConfigValue } from "../actions/config/getConfigValue";
import { setConfigValue } from "../actions/config/setConfigValue";

const ARG_GET = "get";
const ARG_SET = "set";
const ARG_HELP = "help";

type Argument = typeof ARG_GET | typeof ARG_SET | typeof ARG_HELP;

export default async function config(params: string[], storage: Storage): Promise<string> {
  if (params.length < 1) {
    return `Invalid command structure. Expected either \`${ARG_GET}\` or \`${ARG_SET}\``;
  }

  const arg = params[0].toLowerCase() as Argument;

  switch (arg) {
    case ARG_GET: {
      // Get stuff
      if (params.length < 2) {
        return listKeys();
      }

      const key = params[1];
      if (isConfigKey(key)) {
        const value = await getConfigValue(storage, key);
        return `**${key}**: ${JSON.stringify(value)}`;
      }

      return "Invalid key. " + listKeys();
    }

    case ARG_SET: {
      // Set stuff
      if (params.length < 2) {
        return listKeys();
      }
      if (params.length < 3) {
        return "Expected a value to set.";
      }

      const key = params[1];
      const value = params[2];
      if (!isConfigKey(key)) {
        return "Invalid key. " + listKeys();
      }
      if (!isConfigValue(value)) {
        return "invalid type of value.";
      }
      await setConfigValue(storage, key, value);
      return `**${key}**: ${value}`;
    }

    case ARG_HELP:
      // List all the keys
      console.log("Received 'config help' command.");
      return listKeys();

    default:
      console.log("Received invalid config command.");
      return `Invalid command argument. Expected either \`${ARG_GET}\` or \`${ARG_SET}\``;
  }
}
