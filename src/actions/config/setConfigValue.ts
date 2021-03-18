import type { Storage } from "../../configStorage";
import {
  ConfigKey,
  ConfigValue,
  CONFIG_KEY_COMMAND_PREFIX,
  CONFIG_KEY_QUEUE_CHANNEL,
  CONFIG_KEY_QUEUE_LIMIT_ENTRY_DURATION
} from "../../constants/config";

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
  return setConfigValue(storage, CONFIG_KEY_COMMAND_PREFIX, value);
}

export async function setConfigQueueChannel(
  storage: Storage | null,
  value: string | null
): Promise<void> {
  return setConfigValue(storage, CONFIG_KEY_QUEUE_CHANNEL, value);
}

export async function setConfigQueueLimitEntryDuration(
  storage: Storage | null,
  value: number
): Promise<void> {
  return setConfigValue(storage, CONFIG_KEY_QUEUE_LIMIT_ENTRY_DURATION, value);
}
