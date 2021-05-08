import type { Subcommand } from "../Command";
import { SAFE_PRINT_LENGTH } from "../../constants/output";
import { listKeys, allKeys } from "../../constants/config/keys";
import { isConfigKey, isConfigValue } from "../../constants/config";
import { setConfigValue } from "../../actions/config/setConfigValue";

const set: Subcommand = {
  name: "set",
  description: "Change the server's prefix for message commands.",
  type: "SUB_COMMAND_GROUP",
  options: allKeys.map(key => ({
    name: key,
    description: `Set a new value for the '${key}' config key.`,
    type: "SUB_COMMAND",
    options: [
      {
        name: "value",
        description: `The new value for the '${key}' config key.`,
        type: "STRING",
        required: true
      }
    ]
  })),
  async execute({ options, storage, reply }) {
    const key: string | undefined = options[0]?.name;
    if (key === undefined || key === "") {
      return reply(listKeys());
    }

    if (!isConfigKey(key)) {
      const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
      return reply(`I'm not sure what ${that} is. Try one of ${listKeys()}`);
    }

    const value = (options[0]?.options ?? [])[0]?.value as string | undefined;
    if (value === undefined || value === "") {
      return reply("Expected a value to set.");
    }
    if (!isConfigValue(value)) {
      return reply("Invalid value type.");
    }
    await setConfigValue(storage, key, value);
    return reply(`**${key}**: ${JSON.stringify(value)}`);
  }
};

export default set;
