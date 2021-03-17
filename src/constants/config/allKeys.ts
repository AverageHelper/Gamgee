import { CONFIG_KEY_COMMAND_PREFIX, CONFIG_KEY_QUEUE_CHANNEL } from "./keys";

export type ConfigKey = typeof CONFIG_KEY_COMMAND_PREFIX | typeof CONFIG_KEY_QUEUE_CHANNEL;

const allKeys: Array<ConfigKey> = [CONFIG_KEY_COMMAND_PREFIX, CONFIG_KEY_QUEUE_CHANNEL];

export function isConfigKey(value: unknown): value is ConfigKey {
  return !!value && typeof value === "string" && allKeys.includes(value as ConfigKey);
}

export default allKeys;
