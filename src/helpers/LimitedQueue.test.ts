import LimitedQueue from "./LimitedQueue";

describe("Limited queue", () => {
	let queue: LimitedQueue<number>;

	beforeEach(() => {
		queue = new LimitedQueue(5);
		queue.push(1);
		queue.push(2);
		queue.push(3);
	});

	test("can access a queue's limit", () => {
		const limit = 4;
		queue = new LimitedQueue(limit);
		expect(queue.length).toBe(0);
		expect(queue.limit).toBe(limit);
	});

	test("can show a readonly view of its internal storage", () => {
		expect(queue.length).toBe(3);
		expect(queue.array()).toStrictEqual([1, 2, 3]);
	});

	test("throws an error when trying to create a queue smaller than 1", () => {
		expect(() => new LimitedQueue(0)).toThrowError();
		expect(() => new LimitedQueue(-1)).toThrowError();
		expect(() => new LimitedQueue(1)).not.toThrow();
	});

	test("does not prefill the queue", () => {
		queue = new LimitedQueue(1);
		expect(queue.length).toBe(0);
		expect(queue.array()).toStrictEqual([]);
	});

	test("keeps the queue at its item count limit", () => {
		const limit = 3;
		queue = new LimitedQueue(limit);
		queue.push(1);
		queue.push(2);
		expect(queue.length).toBe(queue.limit - 1);
		expect(queue.length).toBe(limit - 1);
		expect(queue.array()).toStrictEqual([1, 2]);

		queue.push(3);
		expect(queue.length).toBe(queue.limit);
		expect(queue.length).toBe(limit);
		expect(queue.array()).toStrictEqual([1, 2, 3]);

		queue.push(4);
		expect(queue.length).toBe(queue.limit);
		expect(queue.length).toBe(limit);
		expect(queue.array()).toStrictEqual([2, 3, 4]);

		queue.push(5);
		expect(queue.length).toBe(queue.limit);
		expect(queue.length).toBe(limit);
		expect(queue.array()).toStrictEqual([3, 4, 5]);
	});

	test("can pop the oldest element from the queue", () => {
		expect(queue.length).toBe(3);
		expect(queue.limit).toBe(5);

		expect(queue.pop()).toBe(1);
		expect(queue.length).toBe(2);
		expect(queue.limit).toBe(5);

		expect(queue.pop()).toBe(2);
		expect(queue.pop()).toBe(3);
		expect(queue.length).toBe(0);
		expect(queue.limit).toBe(5);

		expect(queue.pop()).toBeUndefined();
	});

	test("can pop a given number of items from the queue", () => {
		expect(queue.length).toBe(3);
		expect(queue.limit).toBe(5);

		expect(queue.pop(1)).toBeUndefined();
		expect(queue.length).toBe(2);
		expect(queue.limit).toBe(5);

		expect(queue.pop(2)).toBeUndefined();
		expect(queue.length).toBe(0);
		expect(queue.limit).toBe(5);

		expect(queue.pop(1)).toBeUndefined();
		expect(queue.length).toBe(0);
		expect(queue.limit).toBe(5);
	});

	test("does nothing with an invalid pop number", () => {
		expect(queue.length).toBe(3);

		expect(queue.pop(0)).toBeUndefined();
		expect(queue.length).toBe(3);

		expect(queue.pop(-1)).toBeUndefined();
		expect(queue.length).toBe(3);

		expect(queue.pop(-2)).toBeUndefined();
		expect(queue.length).toBe(3);

		expect(queue.pop(Number.NEGATIVE_INFINITY)).toBeUndefined();
		expect(queue.length).toBe(3);
	});

	test("can remove an element at an index", () => {
		expect(queue.removeAt(-1)).toBeUndefined();
		expect(queue.removeAt(0)).toBe(1);
		expect(queue.removeAt(1)).toBe(3);
		expect(queue.removeAt(1)).toBeUndefined();
		expect(queue.array()).toStrictEqual([2]);
	});

	test("can remove an element that matches a predicate", () => {
		expect(queue.length).toBe(3);
		expect(queue.array()).toStrictEqual([1, 2, 3]);

		expect(queue.removeFirstWhere(el => el === 2)).toBe(2);
		expect(queue.length).toBe(2);
		expect(queue.array()).toStrictEqual([1, 3]);

		expect(queue.removeFirstWhere(el => el === 2)).toBeUndefined();
		expect(queue.length).toBe(2);
		expect(queue.array()).toStrictEqual([1, 3]);
	});

	test("can iterate over itself", () => {
		let sum = 0;
		for (const num of queue) {
			sum += num;
		}
		expect(sum).toBe(6);

		sum = 0;
		queue.forEach(num => {
			sum += num;
		});
		expect(sum).toBe(6);
	});
});
