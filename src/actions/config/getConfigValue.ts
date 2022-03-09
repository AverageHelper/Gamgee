import type { Storage } from "../../configStorage.js";
import type { ConfigKey, ConfigValue } from "../../constants/config/index.js";
import { CONFIG_KEY_COMMAND_PREFIX } from "../../constants/config/index.js";
import defaultValueForConfigKey from "../../constants/config/defaultValueForConfigKey.js";

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
