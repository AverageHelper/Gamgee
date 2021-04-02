import Discord from "discord.js";

type JobQueueLifecycleEvent = "start" | "finish";

/**
 * A queue of work items to be processed sequentially.
 */
export class JobQueue<Job> {
  #workItems: Array<Job> = [];
  #currentJob: Job | null = null;
  #worker: ((job: Job) => void | Promise<void>) | null = null;

  #startHandlers: Array<() => void> = [];
  #completionHandlers: Array<() => void> = [];

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

  /**
   * Registers a function to be called when the queue starts processing its workload,
   * or the workload increases in size.
   */
  on(event: "start", cb: () => void): void;

  /** Registers a function to be called on completion of the queue's workload. */
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  on(event: "finish", cb: () => void): void;

  on(event: JobQueueLifecycleEvent, cb: () => void): void {
    switch (event) {
      case "start":
        this.#startHandlers.push(cb);
        break;

      case "finish":
        this.#completionHandlers.push(cb);
        break;
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
    if (!this.#worker) {
      this.#worker = fn;
      void this.tryToStart();
    }
  }

  private async tryToStart(): Promise<void> {
    const worker = this.#worker;
    // Don't start processing if we have no worker
    if (!worker) return;

    this.callStarts();

    // Don't start processing again if we're already processing
    if (this.#currentJob) return;

    while (this.length > 0) {
      const workItem = this.#workItems.shift() ?? null;
      this.#currentJob = workItem;
      if (workItem) {
        await worker(workItem);
      }
    }

    this.callCompletions();
  }

  private callStarts(): void {
    this.#startHandlers.forEach(cb => cb());
  }

  private callCompletions(): void {
    this.#completionHandlers.forEach(cb => cb());
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
