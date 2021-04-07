import type { Storage } from "../../configStorage";
import type { ConfigKey, ConfigValue } from "../../constants/config";
import { CONFIG_KEY_COMMAND_PREFIX } from "../../constants/config";
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
