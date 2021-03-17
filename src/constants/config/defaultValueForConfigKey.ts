import type { ConfigKey } from "./allKeys";
import assertUnreachable from "../../helpers/assertUnreachable";
import { CONFIG_KEY_COMMAND_PREFIX, CONFIG_KEY_QUEUE_CHANNEL } from "./keys";

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
      return "!";

    case CONFIG_KEY_QUEUE_CHANNEL:
      return null;

    default:
      return assertUnreachable(key);
  }
}
