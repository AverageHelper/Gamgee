import type Discord from "discord.js";
import { useTestLogger } from "../testUtils/logger";

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
  waiterCollection: Discord.Collection<number, (arg: T) => boolean>
): (arg: T) => void {
  return function handleEvent(arg): void {
    if (waiterCollection.size === 0) return;

    const removed = waiterCollection.sweep((waiter, id) => {
      const shouldRemove = waiter(arg);
      if (shouldRemove) {
        logger.debug(`Waiter ${id} handled a deleted message. Removing from the loop...`);
      } else {
        logger.debug(`Waiter ${id} did not handle the message. Keeping in the loop.`);
      }
      return shouldRemove;
    });
    logger.debug(`Removed ${removed} finished waiters.`);
  };
}
