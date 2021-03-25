import type Discord from "discord.js";
import { messageWaiters, messageDeleteWaiters } from "./testerClient";
import { useTestLogger } from "../testUtils/logger";

const logger = useTestLogger();

const DEFAULT_TIMEOUT = 10000;

function uuid(): number {
  return Date.now();
}

function waitForEventInCollection<T>(
  eventPool: Discord.Collection<number, (msg: T) => boolean>,
  condition: (msg: T) => boolean = () => true,
  timeout: number = DEFAULT_TIMEOUT
): Promise<T | null> {
  return new Promise(resolve => {
    const id = uuid();

    const timer = setTimeout(() => {
      // Remove self from the waters list
      if (eventPool.delete(id)) {
        logger.debug(`Waiter ${id} was removed due to timeout.`);
        return resolve(null);
      }
      logger.debug(`Waiter ${id} was already removed. (Should rarely see this)`);
    }, timeout);

    function newMessage(message: T): boolean {
      const shouldHandle = condition(message);
      if (shouldHandle) {
        logger.debug(`Waiter ${id} received a message we should handle. Removing from loop...`);
        clearTimeout(timer);
        resolve(message);
      } else {
        logger.debug(`Waiter ${id} received a message, but we should not handle it.`);
      }
      return shouldHandle;
    }

    eventPool.set(id, newMessage);
  });
}

/**
 * Waits for a new message from Discord. Waits up to a provided `timeout`
 * (default 10 seconds) for one to arrive that fulfills the provided
 * `condition` before resolving the promise with `null`.
 *
 * @returns A `Promise` which resolves with a Discord message or `null`,
 * depending on whether a message arrives before the `timeout`.
 */
export function waitForMessage(
  condition: (msg: Discord.Message) => boolean = () => true,
  timeout: number = DEFAULT_TIMEOUT
): Promise<Discord.Message | null> {
  return waitForEventInCollection(messageWaiters, condition, timeout);
}

/**
 * Waits for message deletion event. Waits up to a provided `timeout`
 * (default 10 seconds) for one to arrive that fulfills the provided
 * `condition` before resolving the promise with `null`.
 *
 * @returns A `Promise` which resolves with a Discord message or `null`,
 * depending on whether a message was deleted before the `timeout`.
 */
export function waitForMessageDeletion(
  condition: (msg: Discord.Message) => boolean = () => true,
  timeout: number = DEFAULT_TIMEOUT
): Promise<Discord.Message | null> {
  return waitForEventInCollection(messageDeleteWaiters, condition, timeout);
}
