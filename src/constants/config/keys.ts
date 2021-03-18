export const CONFIG_KEY_COMMAND_PREFIX = "command_prefix";
export const CONFIG_KEY_QUEUE_CHANNEL = "queue_channel";
export const CONFIG_KEY_QUEUE_LIMIT_ENTRY_DURATION = "queue_limit_entry_duration";

export type ConfigKey =
  | typeof CONFIG_KEY_COMMAND_PREFIX
  | typeof CONFIG_KEY_QUEUE_CHANNEL
  | typeof CONFIG_KEY_QUEUE_LIMIT_ENTRY_DURATION;

export const allKeys: Array<ConfigKey> = [
  CONFIG_KEY_COMMAND_PREFIX,
  CONFIG_KEY_QUEUE_CHANNEL,
  CONFIG_KEY_QUEUE_LIMIT_ENTRY_DURATION
];

export function isConfigKey(value: unknown): value is ConfigKey {
  return !!value && typeof value === "string" && allKeys.includes(value as ConfigKey);
}

/**
 * Returns a message body that lists appropriate command keys to the user.
 */
export function listKeys(): string {
  const keyList = allKeys //
    .map(key => `  - \`${key}\``)
    .join("\n");
  return `Valid config keys are as follows:\n${keyList}`;
}
