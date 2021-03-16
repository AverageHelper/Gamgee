import type { Storage } from "../../storage";
import type { ConfigKey, ConfigValue } from "../../constants/config";

export async function setConfigValue(
  storage: Storage,
  key: ConfigKey,
  value: ConfigValue | undefined
): Promise<void> {
  if (value === undefined) {
    await storage.removeItem(key);
  } else {
    await storage.set(key, value);
  }
}

export async function setConfigCommandPrefix(storage: Storage, value: string): Promise<void> {
  return setConfigValue(storage, "command_prefix", value);
}
