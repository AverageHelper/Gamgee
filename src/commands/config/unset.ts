import type { Subcommand } from "../Command";
import { SAFE_PRINT_LENGTH } from "../../constants/output";
import { listKeys } from "../../constants/config/keys";
import { isConfigKey, allKeys } from "../../constants/config";
import { getConfigValue } from "../../actions/config/getConfigValue";
import { setConfigValue } from "../../actions/config/setConfigValue";

const unset: Subcommand = {
  name: "unset",
  description: "Reset the value of a configuration setting to default.",
  options: allKeys.map(key => ({
    name: key,
    description: `Reset the value of the ${key} config key to default.`,
    type: "SUB_COMMAND"
  })),
  type: "SUB_COMMAND_GROUP",
  requiresGuild: false,
  async execute({ options, storage, reply }) {
    const key: string | undefined = options[0]?.name;
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
};

export default unset;
