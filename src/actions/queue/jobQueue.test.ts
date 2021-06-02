import { useJobQueue, jobQueues, JobQueue } from "./jobQueue";
import { useTestLogger } from "../../../tests/testUtils/logger";

const logger = useTestLogger("error");

describe("Job queue", () => {
	const queueKey = "queue1234";

	beforeEach(() => {
		jobQueues.clear();
	});

	test("begins with zero elements", () => {
		const queue = useJobQueue(queueKey);
		expect(queue.workItems).toStrictEqual([]);
		expect(queue.length).toBe(0);
		expect(queue.numberWaiting).toBe(0);
	});

	test("can add a job to the queue", () => {
		const queue = useJobQueue<number>(queueKey);
		queue.createJob(0);
		expect(queue.workItems).toStrictEqual([0]);
		expect(queue.length).toBe(1);
		expect(queue.numberWaiting).toBe(1);
	});

	test("can add multiple jobs to the queue", () => {
		const queue = useJobQueue<number>(queueKey);
		queue.createJobs([0, 1, 2]);
		expect(queue.length).toBe(3);
		expect(queue.numberWaiting).toBe(3);
	});

	test("can retrieve work items", () => {
		const items = [0, 1, 2];
		const queue = useJobQueue<number>(queueKey);
		expect(queue.workItems).toStrictEqual([]);
		queue.createJobs(items);
		expect(queue.workItems).toStrictEqual(items);
	});

	test("only starts work when the worker function is registered", () => {
		const queue = useJobQueue<number>(queueKey);
		queue.createJobs([2, 3, 4]);
		expect(queue.numberWaiting).toBe(3);
		expect(queue.length).toBe(3);
		queue.process(() => undefined);
		expect(queue.numberWaiting).toBe(2);
		expect(queue.length).toBe(3);
	});

	test("useJobQueue retrieves the same queue", () => {
		const queue1 = useJobQueue<number>("queue1");
		queue1.createJob(1);
		const queue2 = useJobQueue<number>("queue2");
		queue2.createJob(2);

		let storedQueue = useJobQueue<number>("queue1");
		expect(storedQueue.workItems).toStrictEqual(queue1.workItems);

		storedQueue = useJobQueue<number>("queue2");
		expect(storedQueue.workItems).toStrictEqual(queue2.workItems);
	});

	test("calls a callback for each work item", async () => {
		const queue = useJobQueue<number>(queueKey);
		const cb = jest.fn().mockImplementation(async () => {
			await new Promise(resolve => setTimeout(resolve, 100));
		});
		queue.process(cb);
		expect(cb).not.toHaveBeenCalled();

		queue.createJob(10);
		expect(queue.length).toBe(1);
		await new Promise(resolve => setTimeout(resolve, 200));
		expect(cb).toHaveBeenCalled();
		expect(queue.length).toBe(0);

		queue.createJobs([10, 11]);
		expect(queue.length).toBe(2);
		await new Promise(resolve => setTimeout(resolve, 400));
		expect(queue.length).toBe(0);

		expect(cb).toHaveBeenCalledTimes(3);
		expect(cb).toHaveBeenNthCalledWith(1, 10);
		expect(cb).toHaveBeenNthCalledWith(2, 10);
		expect(cb).toHaveBeenNthCalledWith(3, 11);
	});

	test("calls callback items in order", async () => {
		const queue = useJobQueue<number>(queueKey);
		const cb = jest.fn().mockImplementation(async (arg: number) => {
			logger.debug(`Started processing ${arg}`);
			await new Promise(resolve => setTimeout(resolve, 100));
			logger.debug(`Finished processing ${arg}`);
		});
		queue.process(cb);
		expect(cb).not.toHaveBeenCalled();

		queue.createJob(10);
		expect(queue.length).toBe(1);

		queue.createJob(10);
		queue.createJob(11);
		expect(queue.length).toBe(3);

		await new Promise<void>(resolve => queue.on("finish", resolve));
		expect(cb).toHaveBeenCalledTimes(3);
		expect(cb).toHaveBeenNthCalledWith(1, 10);
		expect(cb).toHaveBeenNthCalledWith(2, 10);
		expect(cb).toHaveBeenNthCalledWith(3, 11);
	});

	test("calls a callback when finished", async () => {
		const queue = useJobQueue<number>(queueKey);
		const cb = jest.fn();
		const onFinished = jest.fn();

		queue.createJobs([1, 2, 3]);
		queue.on("finish", onFinished);
		expect(onFinished).not.toHaveBeenCalled();

		queue.process(cb);
		await new Promise<void>(resolve => queue.on("finish", resolve));

		expect(onFinished).toHaveBeenCalledTimes(1);
		expect(cb).toHaveBeenCalledTimes(3);
	});

	test("calls a callback on error", async () => {
		const queue = useJobQueue<number>(queueKey);
		const cb = jest.fn().mockRejectedValueOnce("throw me");
		const onError = jest.fn();

		queue.createJobs([1, 2, 3]);
		queue.on("error", onError);
		expect(onError).not.toHaveBeenCalled();

		queue.process(cb);
		await new Promise<void>(resolve => queue.on("finish", resolve));

		expect(onError).toHaveBeenCalledTimes(1);
		expect(onError).toHaveBeenCalledWith("throw me", 1);
		expect(cb).toHaveBeenCalledTimes(3);
	});

	test("doesn't call the error callback if the callback was removed", async () => {
		const queue = new JobQueue<number>(null);
		const cb = jest.fn().mockRejectedValue("throw me");
		const onError = jest.fn().mockResolvedValue(true);

		queue.createJobs([1, 2, 3]);
		queue.on("error", onError);
		expect(onError).not.toHaveBeenCalled();

		queue.removeAllListeners("error");

		queue.process(cb);
		await new Promise<void>(resolve => queue.on("finish", resolve));

		expect(cb).toHaveBeenCalledTimes(3);
		expect(onError).not.toHaveBeenCalled();
	});

	test("calls the error callback for every failing job", async () => {
		const queue = useJobQueue<number>(queueKey);
		const cb = jest.fn().mockRejectedValue("throw me");
		const onError = jest.fn().mockResolvedValue(true);

		queue.createJobs([1, 2, 3]);
		queue.on("error", onError);
		expect(onError).not.toHaveBeenCalled();

		queue.process(cb);
		await new Promise<void>(resolve => queue.on("finish", resolve));

		expect(cb).toHaveBeenCalledTimes(3);
		expect(onError).toHaveBeenCalledTimes(3);
		expect(onError).toHaveBeenNthCalledWith(1, "throw me", 1);
		expect(onError).toHaveBeenNthCalledWith(2, "throw me", 2);
		expect(onError).toHaveBeenNthCalledWith(3, "throw me", 3);
	});

	test("optionally cancels remaining items based on the result of the error callback", async () => {
		const queue = useJobQueue<number>(queueKey);
		const cb = jest.fn().mockRejectedValueOnce("throw me");
		const onError = jest.fn().mockReturnValue(false);

		queue.createJobs([1, 2, 3]);
		queue.on("error", onError);
		expect(onError).not.toHaveBeenCalled();

		queue.process(cb);
		await new Promise<void>(resolve => queue.on("finish", resolve));

		expect(onError).toHaveBeenCalledTimes(1);
		expect(onError).toHaveBeenCalledWith("throw me", 1);
		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb).toHaveBeenCalledWith(1);
	});

	test("optionally awaits the result of the error callback, and cancels remaining items if false", async () => {
		const queue = useJobQueue<number>(queueKey);
		const cb = jest.fn().mockRejectedValueOnce("throw me");
		const onError = jest.fn().mockResolvedValue(false);

		queue.createJobs([1, 2, 3]);
		queue.on("error", onError);
		expect(onError).not.toHaveBeenCalled();

		queue.process(cb);
		await new Promise<void>(resolve => queue.on("finish", resolve));

		expect(onError).toHaveBeenCalledTimes(1);
		expect(onError).toHaveBeenCalledWith("throw me", 1);
		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb).toHaveBeenCalledWith(1);
	});

	test("runs worker functions sequentially", async () => {
		const queue = useJobQueue<number>(queueKey);
		const cb = jest.fn();

		queue.createJobs(new Array(500).fill(1)); // add first batch
		queue.process(cb); // start processing
		queue.createJobs(new Array(500).fill(2)); // add second batch

		// Wait for the queue to finish
		await new Promise<void>(resolve => queue.on("finish", resolve));

		expect(cb).toHaveBeenCalledTimes(1000);
		for (let index = 0; index < 1000; index += 1) {
			// Make sure the first 500 were called before the second
			expect(cb).toHaveBeenNthCalledWith(index + 1, index < 500 ? 1 : 2);
		}
	});

	test("processes new work items sequentially", async () => {
		const queue = useJobQueue<number>(queueKey);
		const cb = jest.fn();

		queue.process(cb); // start processing
		queue.createJobs(new Array(500).fill(1)); // add first batch
		queue.createJobs(new Array(500).fill(2)); // add second batch

		// Wait for the queue to finish
		await new Promise<void>(resolve => queue.on("finish", resolve));

		expect(cb).toHaveBeenCalledTimes(1000);
		for (let index = 0; index < 1000; index += 1) {
			// Make sure the first 500 were called before the second
			expect(cb).toHaveBeenNthCalledWith(index + 1, index < 500 ? 1 : 2);
		}
	});

	test("doesn't call a start callback when the callback was removed", async () => {
		const queue = useJobQueue<number>(queueKey);
		const cb = jest.fn();
		const onStart = jest.fn();

		queue.on("start", onStart);
		expect(onStart).not.toHaveBeenCalled();

		queue.removeAllListeners("start");

		queue.process(cb); // "start" would get called
		expect(cb).not.toHaveBeenCalled();
		expect(onStart).not.toHaveBeenCalled();

		queue.createJob(1);
		queue.createJobs([2, 3]);
		await new Promise<void>(resolve => queue.on("finish", resolve));

		expect(cb).toHaveBeenCalledTimes(3);
		expect(onStart).not.toHaveBeenCalled();
	});

	test("calls a start callback when work starts", async () => {
		const queue = useJobQueue<number>(queueKey);
		const cb = jest.fn();
		const onStart = jest.fn();

		queue.on("start", onStart);
		expect(onStart).not.toHaveBeenCalled();

		queue.process(cb); // "start" gets called
		expect(onStart).toHaveBeenCalledTimes(1);

		queue.createJob(1); // "start" gets called
		queue.createJobs([2, 3]); // "start" get called once more
		await new Promise<void>(resolve => queue.on("finish", resolve));

		expect(cb).toHaveBeenCalledTimes(3);
		expect(onStart).toHaveBeenCalledTimes(3);
	});

	test("doesn't call finish if the callback was removed", async () => {
		const queue = useJobQueue<number>(queueKey);
		const cb = jest.fn();
		const onFinish = jest.fn();

		queue.on("finish", onFinish);
		expect(onFinish).not.toHaveBeenCalled();

		queue.removeAllListeners("finish");

		queue.process(cb); // "finish" would get called right away
		expect(onFinish).not.toHaveBeenCalled();

		queue.createJobs([1, 2, 3]);
		await new Promise<void>(resolve => queue.on("finish", resolve));

		expect(cb).toHaveBeenCalledTimes(3);
		expect(onFinish).not.toHaveBeenCalled();
	});

	test("calls finish only after start", async () => {
		const queue = useJobQueue<number>(queueKey);
		const cb = jest.fn();
		const onStart = jest.fn();
		const onFinish = jest.fn();

		queue.on("start", onStart);
		queue.on("finish", onFinish);
		expect(onStart).not.toHaveBeenCalled();
		expect(onFinish).not.toHaveBeenCalled();

		queue.process(cb); // "start" gets called, then "finish" right away
		expect(onStart).toHaveBeenCalledTimes(1);
		expect(onFinish).toHaveBeenCalledTimes(1);
		onStart.mockClear();
		onFinish.mockClear();

		queue.createJobs([1, 2, 3]); // "start" gets called once more
		await new Promise<void>(resolve => queue.on("finish", resolve));
		expect(onStart).toHaveBeenCalledTimes(1);
		expect(onFinish).toHaveBeenCalledTimes(1);
	});
});
