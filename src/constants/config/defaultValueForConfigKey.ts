import { ConfigKey, CONFIG_KEY_COMMAND_PREFIX } from "./keys";
import assertUnreachable from "../../helpers/assertUnreachable";

export type ConfigValue = string | number | null;

export function isConfigValue(value: unknown): value is ConfigValue {
  return (
    value !== undefined &&
    (typeof value === "string" || typeof value === "number" || value === null)
  );
}

export default function defaultValueForConfigKey(key: ConfigKey): ConfigValue {
  switch (key) {
    case CONFIG_KEY_COMMAND_PREFIX:
      return "?";

    default:
      return assertUnreachable(key);
  }
}
