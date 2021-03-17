import type { Storage } from "../../storage";
import type { ConfigKey, ConfigValue } from "../../constants/config";
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
  return getConfigValue(storage, "command_prefix") as Promise<string>;
}

export async function getConfigQueueChannel(storage: Storage | null): Promise<string | null> {
  return getConfigValue(storage, "queue_channel") as Promise<string | null>;
}
