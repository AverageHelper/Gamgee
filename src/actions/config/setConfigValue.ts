import type { Storage } from "../../configStorage";
import type { ConfigKey, ConfigValue } from "../../constants/config";

export async function setConfigValue(
  storage: Storage | null,
  key: ConfigKey,
  value: ConfigValue | undefined
): Promise<void> {
  if (!storage) return;

  if (value === undefined) {
    await storage.removeItem(key);
  } else {
    await storage.set(key, value);
  }
}

export async function setConfigCommandPrefix(
  storage: Storage | null,
  value: string
): Promise<void> {
  return setConfigValue(storage, "command_prefix", value);
}

export async function setConfigQueueChannel(
  storage: Storage | null,
  value: string | null
): Promise<void> {
  return setConfigValue(storage, "queue_channel", value);
}
