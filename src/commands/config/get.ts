import type { Subcommand } from "../Command";
import { SAFE_PRINT_LENGTH } from "../../constants/output";
import { listKeys } from "../../constants/config/keys";
import { isConfigKey, allKeys } from "../../constants/config";
import { getConfigValue } from "../../actions/config/getConfigValue";

const get: Subcommand = {
  name: "get",
  description: "Get the value of a configuration setting.",
  options: allKeys.map(key => ({
    name: key,
    description: `Get the value of the ${key} config key.`,
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
      const value = await getConfigValue(storage, key);
      return reply(`**${key}**: ${JSON.stringify(value)}`);
    }

    const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
    return reply(`I'm not sure what ${that} is. Try one of ${listKeys()}`);
  }
};

export default get;
