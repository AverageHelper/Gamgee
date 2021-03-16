import type { ConfigKey } from "./allKeys";

export type ConfigValue = string | number | null;

export function isConfigValue(value: unknown): value is ConfigValue {
  return (
    value !== undefined &&
    (typeof value === "string" || typeof value === "number" || value === null)
  );
}

function assertUnreachable(x: never): never {
  throw new Error(`Unexpected value ${JSON.stringify(x)}`);
}

export default function defaultValueForConfigKey(key: ConfigKey): ConfigValue {
  switch (key) {
    case "command_prefix":
      return "!";

    default:
      return assertUnreachable(key);
  }
}
