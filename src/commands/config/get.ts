import type { NamedSubcommand } from "../Command";
import { SAFE_PRINT_LENGTH } from "../../constants/output";
import { listKeys } from "../../constants/config/keys";
import { isConfigKey } from "../../constants/config";
import { getConfigValue } from "../../actions/config/getConfigValue";
import { replyWithMention } from "../../actions/messages";

const get: NamedSubcommand = {
  name: "get",
  description: "Get the value of a configuration setting.",
  async execute({ message, args, storage }) {
    const key = args[1];
    if (key === undefined || key === "") {
      return replyWithMention(message, listKeys());
    }

    if (isConfigKey(key)) {
      const value = await getConfigValue(storage, key);
      return replyWithMention(message, `**${key}**: ${JSON.stringify(value)}`);
    }

    const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
    return replyWithMention(message, `I'm not sure what ${that} is. Try one of ${listKeys()}`);
  }
};

export default get;
