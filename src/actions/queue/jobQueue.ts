import Discord from "discord.js";
import { EventEmitter } from "events";

type JobQueueLifecycleEvent = "start" | "error" | "finish";

type JobErrorNotificationHandler<Job> = (error: unknown, failedJob: Job) => void | Promise<void>;

type JobErrorContinuationHandler<Job> = (
  error: unknown,
  failedJob: Job
) => boolean | Promise<boolean>;

export type JobErrorHandler<Job> =
  | JobErrorNotificationHandler<Job>
  | JobErrorContinuationHandler<Job>;

/**
 * A queue of work items to be processed sequentially.
 */
export class JobQueue<Job> {
  readonly #bus: EventEmitter = new EventEmitter();
  readonly #workItems: Array<Job> = [];
  #errorHandler: JobErrorHandler<Job> | null = null;
  #currentJob: Job | null = null;
  #worker: ((job: Job) => void | Promise<void>) | null = null;

  constructor() {
    // Permit unlimited listeners
    // FIXME: This is likely bad practice. See about unsubscribing once done
    this.#bus.setMaxListeners(Number.POSITIVE_INFINITY);
  }

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
  on(event: "error", cb: JobErrorHandler<Job>): void;

  /** Registers a function to be called on completion of the queue's workload. */
  on(event: "finish", cb: () => void): void;
  /* eslint-enable @typescript-eslint/unified-signatures */

  on(event: JobQueueLifecycleEvent, cb: (() => void) | JobErrorHandler<Job>): void {
    if (event === "error") {
      this.#errorHandler = cb as JobErrorHandler<Job>;
    } else {
      this.#bus.on(event, cb as () => void);
    }
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
          if (!this.#errorHandler) throw error;

          const shouldContinue = (await this.#errorHandler(error, workItem)) ?? true;
          if (shouldContinue === false) {
            this.#workItems.splice(0, this.#workItems.length);
          }
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

export function forgetJobQueue(key: string): void {
  const queue = jobQueues.get(key);
  if (!queue) return;

  jobQueues.delete(key);
}
