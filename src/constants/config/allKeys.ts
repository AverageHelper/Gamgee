import { CONFIG_KEY_COMMAND_PREFIX } from "./keys";

export type ConfigKey = typeof CONFIG_KEY_COMMAND_PREFIX;

const allKeys: Array<ConfigKey> = [CONFIG_KEY_COMMAND_PREFIX];

export function isConfigKey(value: unknown): value is ConfigKey {
  return !!value && typeof value === "string" && allKeys.includes(value as ConfigKey);
}

export default allKeys;
