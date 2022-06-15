// TODO: Was this a good idea?

/**
 * An object which manages an array like a queue with a limited number of total items.
 * @deprecated
 */
export class LimitedQueue<T> {
	#storage: Array<T>;
	#limit: number;

	constructor(limit: number = 5) {
		if (limit < 1) throw new Error("Cannot create a `LimitedQueue` with max size less than 1.");
		this.#limit = limit;
		this.#storage = [];
	}

	/**
	 * The current number of items in the queue.
	 */
	get length(): number {
		return this.array().length;
	}

	/**
	 * The maximum number of items allowed in the queue at any given time.
	 */
	get limit(): number {
		return this.#limit;
	}

	/**
	 * A read-only view of the queue's internal storage.
	 *
	 * Before any mutations take place on this value, it should first be `slice`d.
	 */
	array(): ReadonlyArray<T> {
		return this.#storage;
	}

	[Symbol.iterator](): IterableIterator<T> {
		return this.array().values();
	}

	/**
	 * Performs the specified action for each element in an array.
	 *
	 * @param callbackfn A function that accepts up to three arguments. forEach calls
	 * the callbackfn function one time for each element in the array.
	 *
	 * @param thisArg An object to which the this keyword can refer in the callbackfn
	 * function. If thisArg is omitted, undefined is used as the this value.
	 */
	forEach(
		callbackfn: (element: T, index: number, array: ReadonlyArray<T>) => void,
		thisArg?: unknown
	): void {
		return this.array().forEach(callbackfn, thisArg);
	}

	/**
	 * Pushes an item onto the queue's storage. Removes the oldest
	 * item if the queue is full.
	 */
	push(item: T): void {
		if (this.length >= this.limit) {
			this.pop();
		}
		this.#storage.push(item);
	}

	/**
	 * Pops the given number of old elements off the queue.
	 *
	 * @param count The number of old items to pop.
	 */
	pop(count: number): void;

	/**
	 * Pops the oldest item off the queue and returns it.
	 *
	 * @returns the oldest item in the queue, or `undefined` if the queue is empty.
	 */
	pop(): T | undefined;

	pop(count?: number): T | undefined {
		if (count === undefined) {
			return this.#storage.shift();
		}

		this.#storage.splice(0, count);
		return undefined;
	}

	/**
	 * Removes an item at the given index and returns it.
	 *
	 * @param index The index of the item to return.
	 *
	 * @returns the item that was at the given index, or `undefined` if there is no such item.
	 */
	removeAt(index: number): T | undefined {
		if (index < 0) return undefined;
		return this.#storage.splice(index, 1)[0];
	}

	/**
	 * Removes the first element that matches a predicate and returns it.
	 */
	removeFirstWhere(
		predicate: (el: T, index: number, array: ReadonlyArray<T>) => boolean
	): T | undefined {
		for (let index = 0; index < this.#storage.length; index++) {
			const element = this.#storage[index];
			if (element === undefined) return undefined;

			if (predicate(element, index, this.array())) {
				return this.removeAt(index);
			}
		}

		return undefined;
	}
}
