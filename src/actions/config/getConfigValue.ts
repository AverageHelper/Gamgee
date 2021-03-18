import type { Storage } from "../../configStorage";
import {
  ConfigKey,
  ConfigValue,
  CONFIG_KEY_COMMAND_PREFIX,
  CONFIG_KEY_QUEUE_CHANNEL
} from "../../constants/config";
import defaultValueForConfigKey from "../../constants/config/defaultValueForConfigKey";

export async function getConfigValue(
  storage: Storage | null,
  key: ConfigKey
): Promise<ConfigValue> {
  if (!storage) {
    return defaultValueForConfigKey(key);
  }
  const storedValue = (await storage.get(key)) as ConfigValue | undefined;

  if (storedValue === undefined) {
    return defaultValueForConfigKey(key);
  }

  return storedValue ?? null;
}

export async function getConfigCommandPrefix(storage: Storage | null): Promise<string> {
  const val = (await getConfigValue(storage, CONFIG_KEY_COMMAND_PREFIX)) as string;
  return val.toString();
}

export async function getConfigQueueChannel(storage: Storage | null): Promise<string | null> {
  const val = (await getConfigValue(storage, CONFIG_KEY_QUEUE_CHANNEL)) as string | null;
  return val?.toString() ?? null;
}
