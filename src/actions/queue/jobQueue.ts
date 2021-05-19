import Discord from "discord.js";
import { EventEmitter } from "events";

type JobQueueLifecycleEvent = "start" | "error" | "finish";

/**
 * A queue of work items to be processed sequentially.
 */
export class JobQueue<Job> {
  readonly #bus: EventEmitter = new EventEmitter();
  readonly #workItems: Array<Job> = [];
  #currentJob: Job | null = null;
  #worker: ((job: Job) => void | Promise<void>) | null = null;

  /** Enqueues a work item to be processed. */
  createJob(job: Job): void {
    this.#workItems.push(job);
    void this.tryToStart();
  }

  /** Enqueues multiple work items to be processed. */
  createJobs(jobs: Array<Job>): void {
    this.#workItems.push(...jobs);
    void this.tryToStart();
  }

  /* eslint-disable @typescript-eslint/unified-signatures */
  /**
   * Registers a function to be called when the queue starts processing its workload,
   * or the workload increases in size.
   */
  on(event: "start", cb: () => void): void;

  /**
   * Registers a function to be called when processing fails for an item.
   */
  on(event: "error", cb: (error: unknown, failedJob: Job) => void): void;

  /** Registers a function to be called on completion of the queue's workload. */
  on(event: "finish", cb: () => void): void;
  /* eslint-enable @typescript-eslint/unified-signatures */

  on(
    event: JobQueueLifecycleEvent,
    cb: (() => void) | ((error: unknown, failedJob: Job) => void)
  ): void {
    this.#bus.on(event, cb);
  }

  /** The work items that have yet to be processed. */
  get workItems(): Array<Job> {
    return this.#workItems;
  }

  /** The number of work items that are waiting to be processed. */
  get numberWaiting(): number {
    return this.#workItems.length;
  }

  /** The total number of work items in the queue. */
  get length(): number {
    return this.#workItems.length + (this.#currentJob !== null ? 1 : 0);
  }

  /**
   * Registers a worker function to process jobs.
   * @param fn The worker function to call for each job.
   */
  process(fn: (job: Job) => void | Promise<void>): void {
    this.#worker = fn;
    void this.tryToStart();
  }

  private async tryToStart(): Promise<void> {
    const worker = this.#worker;
    // Don't start processing if we have no worker
    if (!worker) return;

    this.#bus.emit("start");

    // Don't start processing again if we're already processing
    if (this.#currentJob) return;

    while (this.length > 0) {
      const workItem = this.#workItems.shift() ?? null;
      this.#currentJob = workItem;
      if (workItem) {
        try {
          await worker(workItem);
        } catch (error: unknown) {
          this.#bus.emit("error", error, workItem);
        }
      }
    }

    this.#bus.emit("finish");
  }
}

/** The collection of keyed job queues. */
export const jobQueues = new Discord.Collection<string, JobQueue<unknown>>();

/**
 * Returns the keyed job queue for the given key.
 *
 * @param key A string that identifies the job queue.
 * @returns the cached job queue, or a new queue if none existed previously.
 */
export function useJobQueue<T = never>(key: string): JobQueue<T> {
  let queue = jobQueues.get(key) as JobQueue<T> | undefined;

  if (!queue) {
    queue = new JobQueue();
    jobQueues.set(key, queue as JobQueue<unknown>);
  }

  return queue;
}
