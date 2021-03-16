import type { Storage } from "../../storage";
import type { ConfigKey, ConfigValue } from "../../constants/config";
import defaultValueForConfigKey from "../../constants/config/defaultValueForConfigKey";

export async function getConfigValue(storage: Storage, key: ConfigKey): Promise<ConfigValue> {
  const storedValue = (await storage.get(key)) as ConfigValue | undefined;

  if (storedValue === undefined) {
    return defaultValueForConfigKey(key);
  }

  return storedValue;
}

export async function getConfigCommandPrefix(storage: Storage): Promise<string> {
  return getConfigValue(storage, "command_prefix") as Promise<string>;
}
