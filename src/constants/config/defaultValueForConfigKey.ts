import type { ConfigKey } from "./keys.js";
import { CONFIG_KEY_COMMAND_PREFIX } from "./keys.js";

export type ConfigValue = string | number | null;

export function isConfigValue(value: unknown): value is ConfigValue {
	return (
		value !== undefined &&
		(typeof value === "string" || typeof value === "number" || value === null)
	);
}

export function defaultValueForConfigKey(key: ConfigKey): ConfigValue {
	switch (key) {
		case CONFIG_KEY_COMMAND_PREFIX:
			return "?";
	}
}
