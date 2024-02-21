import type { Client } from "discord.js";
import { parseArgs } from "../helpers/parseArgs.js";
import { useLogger } from "../logger.js";

const logger = useLogger();

/**
 * The private list of all event handlers. You can use this to edit the list within this file.
 */
const _allEventHandlers = new Map<string, EventHandler>();

/**
 * A read-only list of all event handlers.
 */
export const allEventHandlers: ReadonlyMap<string, EventHandler> = _allEventHandlers;

/**
 * Adds an event handler to the list of all handlers.
 * Does NOT register the event handler with the client.
 * Use registerEventHandlers(Client) to update handlers.
 *
 * Only exported for testing purposes. Do not use outside
 * of this file or its tests.
 *
 * @param eventHandler The event handler to add
 */
export function _add(eventHandler: EventHandler): void {
	const name = eventHandler.name;

	if (_allEventHandlers.has(name)) {
		throw new TypeError(
			`Failed to add event handler for '${name}' when a handler for that event was already added`,
		);
	}

	const args = parseArgs();
	const abnormalStart = args.deploy || args.revoke;

	// If we're to deploy commands (not normal startup), the only valid event name is "ready"
	if (abnormalStart && name !== "ready") return;

	_allEventHandlers.set(name, eventHandler);
}

/**
 * Registers all event handlers with the client.
 * @param client The client to register event handlers with
 * @public
 */
export function registerEventHandlers(client: Client): void {
	_allEventHandlers.forEach(eventHandler => {
		// Register the event handler with the correct endpoint
		const eventName = eventHandler.name;
		if (eventHandler.once === true) {
			client.once(eventName, (...args) => eventHandler.execute(...args, logger));
		} else {
			client.on(eventName, (...args) => eventHandler.execute(...args, logger));
		}

		logger.debug(
			`Registered event handler ${eventHandler.once === true ? "once" : "on"}(${eventName})`,
		);
	});
}

// Install event handlers
import { error } from "./error.js";
import { interactionCreate } from "./interactionCreate.js";
import { messageCreate } from "./messageCreate.js";
import { messageReactionAdd } from "./messageReactionAdd.js";
import { ready } from "./ready.js";

_add(error as EventHandler);
_add(interactionCreate as EventHandler);
_add(messageCreate as EventHandler);
_add(messageReactionAdd as EventHandler);
_add(ready as EventHandler);
// Not sure why these type casts are necessary, but they seem sound. We can remove them when TS gets smarter, or we learn what I did wrong
