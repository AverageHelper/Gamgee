import type { ConfigKey } from "./keys";
import { CONFIG_KEY_COMMAND_PREFIX } from "./keys";

export type ConfigValue = string | number | null;

export function isConfigValue(value: unknown): value is ConfigValue {
	return (
		value !== undefined &&
		(typeof value === "string" || typeof value === "number" || value === null)
	);
}

export default function defaultValueForConfigKey(key: ConfigKey): ConfigValue {
	switch (key) {
		case CONFIG_KEY_COMMAND_PREFIX:
			return "?";
	}
}
