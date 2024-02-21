import { useTestLogger } from "../testUtils/logger.js";

const logger = useTestLogger();

/**
 * Creates a function that manages a collection of waiting functions.
 * New events are sent through these waiter functions, and are removed
 * as waiters handle them.
 *
 * @param waiterCollection A collection of waiter functions. Each function
 * either handles the event and returns `true`, or doesn't handle the event
 * and returns `false`.
 *
 * @returns an event receiver function.
 */
export function useDispatchLoop<T>(
	waiterCollection: Map<number, (arg: T) => boolean>,
): (arg: T) => void {
	return function handleEvent(arg): void {
		if (waiterCollection.size === 0) return;

		const keysToRemove: Array<number> = [];
		waiterCollection.forEach((waiter, id) => {
			const shouldRemove = waiter(arg);
			if (shouldRemove) {
				logger.debug(`Waiter ${id} handled a deleted message. Removing from the loop...`);
				keysToRemove.push(id); // mark this key for removal
			} else {
				logger.debug(`Waiter ${id} did not handle the message. Keeping in the loop.`);
			}
		});

		// remove marked keys
		keysToRemove.forEach(id => {
			waiterCollection.delete(id);
		});
		logger.debug(`Removed ${keysToRemove.length} finished waiters.`);
	};
}
