import type { ClientEvents } from "discord.js";

/**
 * Creates an event handler with the given name and parameters.
 */
export function onEvent<K extends keyof ClientEvents>(
	name: K,
	params: Omit<EventHandler<K>, "name">
): EventHandler<K> {
	return {
		name,
		once: params.once ?? false,
		execute: params.execute
	};
}
