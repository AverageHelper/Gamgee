import type Discord from "discord.js";
import { messageWaiters } from "./testerClient";
import { useTestLogger } from "../testUtils/logger";

const logger = useTestLogger();

const DEFAULT_TIMEOUT = 10000;

function uuid(): number {
  return Date.now();
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
  return new Promise(resolve => {
    const id = uuid();

    const timer = setTimeout(() => {
      // Remove self from the waters list
      if (messageWaiters.delete(id)) {
        logger.debug(`Waiter ${id} was removed due to timeout.`);
        return resolve(null);
      }
      logger.debug(`Waiter ${id} was already removed. (Should rarely see this)`);
    }, timeout);

    function newMessage(message: Discord.Message): boolean {
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

    messageWaiters.set(id, newMessage);
  });
}

/**
 * Waits for a new message from Discord in the provided channel. Waits
 * up to a provided `timeout` (default 10 seconds) for one to arrive
 * before resolving the promise with `null`.
 *
 * @returns A `Promise` which resolves with a Discord message or `null`,
 * depending on whether a message arrives before the `timeout`.
 */
export function waitForMessageInChannel(
  channelId: string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<Discord.Message | null> {
  return waitForMessage(msg => msg.channel.id === channelId, timeout);
}

/**
 * Waits for a new message from Discord from the provided user. Waits
 * up to a provided `timeout` (default 10 seconds) for one to arrive
 * before resolving the promise with `null`.
 *
 * @returns A `Promise` which resolves with a Discord message or `null`,
 * depending on whether a message arrives before the `timeout`.
 */
export function waitForMessageFromUser(
  userId: string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<Discord.Message | null> {
  return waitForMessage(msg => msg.author.id === userId, timeout);
}

/**
 * Waits for a new message from Discord in the provided channel and
 * from the provided user. Waits up to a provided `timeout` (default
 * 10 seconds) for one to arrive before resolving the promise with `null`.
 *
 * @returns A `Promise` which resolves with a Discord message or `null`,
 * depending on whether a message arrives before the `timeout`.
 */
export function waitForMessageWithInfo(
  info: { userId: string; channelId: string },
  timeout: number = DEFAULT_TIMEOUT
): Promise<Discord.Message | null> {
  return waitForMessage(
    msg => msg.author.id === info.userId && msg.channel.id === info.channelId,
    timeout
  );
}
