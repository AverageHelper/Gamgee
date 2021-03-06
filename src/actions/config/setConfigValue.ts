import type { Storage } from "../../configStorage";
import type { ConfigKey, ConfigValue } from "../../constants/config";
import { CONFIG_KEY_COMMAND_PREFIX } from "../../constants/config";

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
