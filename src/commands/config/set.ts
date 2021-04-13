import type { NamedSubcommand } from "../Command";
import { SAFE_PRINT_LENGTH } from "../../constants/output";
import { listKeys } from "../../constants/config/keys";
import { isConfigKey, isConfigValue } from "../../constants/config";
import { setConfigValue } from "../../actions/config/setConfigValue";
import { replyWithMention } from "../../actions/messages";

const set: NamedSubcommand = {
  name: "set",
  description: "Set the value of a configuration setting.",
  async execute({ message, args, storage }) {
    const key = args[1];
    if (key === undefined || key === "") {
      return replyWithMention(message, listKeys());
    }

    if (!isConfigKey(key)) {
      const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
      return replyWithMention(message, `I'm not sure what ${that} is. Try one of ${listKeys()}`);
    }

    const value = args[2];
    if (value === undefined || value === "") {
      return replyWithMention(message, "Expected a value to set.");
    }
    if (!isConfigValue(value)) {
      return replyWithMention(message, "Invalid value type.");
    }
    await setConfigValue(storage, key, value);
    return replyWithMention(message, `**${key}**: ${JSON.stringify(value)}`);
  }
};

export default set;
