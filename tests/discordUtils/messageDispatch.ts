import type { Message } from "discord.js";
import { messageWaiters, messageDeleteWaiters } from "./testerClient";
import { useTestLogger } from "../testUtils/logger";

const logger = useTestLogger();

const DEFAULT_TIMEOUT = 10000;

async function uuid(): Promise<number> {
	await new Promise(resolve => setTimeout(resolve, 3)); // ensure Date.now() is a new value
	return Date.now();
}

const caches = new Map<string, Array<Message>>();

function eventCache(key: string): Array<Message> {
	let cache = caches.get(key);
	if (!cache) {
		cache = new Array<Message>();
		caches.set(key, cache);
	}
	return cache;
}

/**
 * Removes and returns the first element (if any) of an array that matches a given predicate.
 */
function removeFirstWhere<T>(
	array: Array<T>,
	predicate: (el: T, index: number, array: ReadonlyArray<T>) => boolean
): T | undefined {
	for (let index = 0; index < array.length; index++) {
		const element = array[index];
		if (element === undefined) return undefined;

		if (predicate(element, index, array)) {
			if (index < 0) return undefined;
			return array.splice(index, 1)[0];
		}
	}

	return undefined;
}

const QUEUE_LIMIT = 5;

async function waitForEventInCollection(
	key: string,
	waiterPool: Map<number, (msg: Message) => boolean>,
	condition: (msg: Message) => boolean = (): boolean => true,
	timeout: number = DEFAULT_TIMEOUT
): Promise<Message | null> {
	const id = await uuid();
	return await new Promise(resolve => {
		const cache = eventCache(key);

		const timer = setTimeout(() => {
			// Remove self from the waters list
			if (waiterPool.delete(id)) {
				logger.debug(`Waiter ${id} was removed due to timeout.`);
				return resolve(null);
			}
			logger.debug(`Waiter ${id} was already removed. (Should rarely see this)`);
		}, timeout);

		function newMessage(newMessage: Message): boolean {
			cache.push(newMessage);
			if (cache.length > QUEUE_LIMIT) {
				cache.shift(); // keep us below 5 items
			}

			let shouldHandle = false;
			for (const message of cache) {
				shouldHandle = condition(message);
				if (shouldHandle) {
					logger.debug(
						`Waiter ${id} received message ${message.id} and should handle it. Removing from loop...`
					);
					clearTimeout(timer);
					removeFirstWhere(cache, msg => msg.id === message.id);
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
	condition: (msg: Message) => boolean = (): boolean => true,
	timeout: number = DEFAULT_TIMEOUT
): Promise<Message | null> {
	return await waitForEventInCollection("messageWaiters", messageWaiters, condition, timeout);
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
	condition: (msg: Message) => boolean = (): boolean => true,
	timeout: number = DEFAULT_TIMEOUT
): Promise<Message | null> {
	return await waitForEventInCollection(
		"messageDeleteWaiters",
		messageDeleteWaiters,
		condition,
		timeout
	);
}
