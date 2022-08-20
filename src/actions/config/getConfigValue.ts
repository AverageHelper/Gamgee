import type { Storage } from "../../configStorage.js";
import { DEFAULT_MESSAGE_COMMAND_PREFIX } from "../../constants/database.js";

/** @deprecated Use a proper database instead */
export async function getConfigCommandPrefix(storage: Storage | null): Promise<string> {
	if (!storage) {
		return DEFAULT_MESSAGE_COMMAND_PREFIX;
	}
	const storedValue = (await storage.get("command_prefix")) as string | number | null | undefined;

	if (typeof storedValue !== "string") return DEFAULT_MESSAGE_COMMAND_PREFIX;
	return storedValue ?? DEFAULT_MESSAGE_COMMAND_PREFIX;
}
