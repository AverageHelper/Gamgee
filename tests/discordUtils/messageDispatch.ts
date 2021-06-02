import Discord from "discord.js";
import LimitedQueue from "../../src/helpers/LimitedQueue";
import { messageWaiters, messageDeleteWaiters } from "./testerClient";
import { useTestLogger } from "../testUtils/logger";

const logger = useTestLogger();

const DEFAULT_TIMEOUT = 10000;

function uuid(): number {
	return Date.now();
}

const caches = new Discord.Collection<string, LimitedQueue<unknown>>();

function eventCache<T>(key: string): LimitedQueue<T> {
	let cache = caches.get(key) as LimitedQueue<T> | undefined;
	if (!cache) {
		cache = new LimitedQueue<T>(5);
		caches.set(key, cache);
	}
	return cache;
}

async function waitForEventInCollection<T extends { id: string }>(
	key: string,
	waiterPool: Discord.Collection<number, (msg: T) => boolean>,
	condition: (msg: T) => boolean = (): boolean => true,
	timeout: number = DEFAULT_TIMEOUT
): Promise<T | null> {
	return new Promise(resolve => {
		const id = uuid();
		const cache = eventCache<T>(key);

		const timer = setTimeout(() => {
			// Remove self from the waters list
			if (waiterPool.delete(id)) {
				logger.debug(`Waiter ${id} was removed due to timeout.`);
				return resolve(null);
			}
			logger.debug(`Waiter ${id} was already removed. (Should rarely see this)`);
		}, timeout);

		function newMessage(newMessage: T): boolean {
			cache.push(newMessage);

			let shouldHandle = false;
			for (const message of cache) {
				shouldHandle = condition(message);
				if (shouldHandle) {
					logger.debug(
						`Waiter ${id} received message ${message.id} and should handle it. Removing from loop...`
					);
					clearTimeout(timer);
					cache.removeFirstWhere(msg => msg.id === message.id);
					resolve(message);
				} else {
					logger.debug(
						`Waiter ${id} received message ${message.id} but should not handle it. Continuing.`
					);
				}
			}
			return shouldHandle;
		}

		waiterPool.set(id, newMessage);
	});
}

/**
 * Waits for a new message from Discord. Waits up to a provided `timeout`
 * (default 5 seconds) for one to arrive that fulfills the provided
 * `condition` before resolving the promise with `null`.
 *
 * @returns a `Promise` which resolves with a Discord message or `null`,
 * depending on whether a message arrives before the `timeout`.
 */
export async function waitForMessage(
	condition: (msg: Discord.Message) => boolean = (): boolean => true,
	timeout: number = DEFAULT_TIMEOUT
): Promise<Discord.Message | null> {
	return waitForEventInCollection("messageWaiters", messageWaiters, condition, timeout);
}

/**
 * Waits for message deletion event. Waits up to a provided `timeout`
 * (default 5 seconds) for one to arrive that fulfills the provided
 * `condition` before resolving the promise with `null`.
 *
 * @returns a `Promise` which resolves with a Discord message or `null`,
 * depending on whether a message was deleted before the `timeout`.
 */
export async function waitForMessageDeletion(
	condition: (msg: Discord.Message) => boolean = (): boolean => true,
	timeout: number = DEFAULT_TIMEOUT
): Promise<Discord.Message | null> {
	return waitForEventInCollection("messageDeleteWaiters", messageDeleteWaiters, condition, timeout);
}
