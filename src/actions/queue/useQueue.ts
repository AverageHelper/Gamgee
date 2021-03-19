import Discord from "discord.js";
import type { QueueConfig } from "../../actions/database/schemas/queueConfigSchema";
import { useQueueStorage, QueueEntry, UnsentQueueEntry } from "../../queueStorage";
import { useLogger } from "../../logger";
import durationString from "../../helpers/durationString";

const logger = useLogger();

export type { QueueEntry, UnsentQueueEntry } from "../../queueStorage";

/**
 * A proxy for queue management and feedback. These methods may modify the
 * queue and manage messages in the queue channel.
 */
interface QueueManager {
  /** Retrieves the queue's configuration settings. */
  getConfig: () => Promise<QueueConfig>;

  /** Updates the provided properties of a queue's configuration settings. */
  updateConfig: (config: Partial<QueueConfig>) => Promise<void>;

  /** Retrieves the number of entries in the queue */
  count: () => Promise<number>;

  /** Retrieves the total playtime of the queue's entries. */
  playtime: () => Promise<number>;

  /** Adds an entry to the queue cache and sends the entry to the queue channel. */
  push: (entry: UnsentQueueEntry) => Promise<QueueEntry>;

  /** Returns the next unmarked element fron the queue. */
  pop: () => Promise<QueueEntry | null>;

  /** Returns all entries in the queue. */
  getAllEntries: () => Promise<Array<QueueEntry>>;

  /** Returns the latest entry from the user with the provided ID. */
  getLatestEntryFrom: (userId: string) => Promise<QueueEntry | null>;

  /** Resets the queue. Deletes all cached data about the queue. */
  clear: () => Promise<void>;
}

/**
 * Sets up and returns an interface for the queue cache and long-term storage.
 *
 * @param queueChannel The channel for the current queue.
 * @returns If we don't have a queue cache stored for the given channel, a new
 *  one is created. We return that. Otherwise, we just return what we have stored
 *  or cached, whichever is handy.
 */
export async function useQueue(queueChannel: Discord.TextChannel): Promise<QueueManager> {
  logger.debug(
    `Preparing persistent queue storage for channel ${queueChannel.id} (#${queueChannel.name})`
  );
  const queueStorage = await useQueueStorage(queueChannel);
  logger.debug("Storage prepared!");

  return {
    getConfig() {
      return queueStorage.getConfig();
    },
    updateConfig(config) {
      return queueStorage.updateConfig(config);
    },
    count() {
      return queueStorage.countAll();
    },
    async playtime() {
      const queue = await queueStorage.fetchAll();
      let duration = 0;
      queue.forEach(e => {
        duration += e.seconds;
      });
      return duration;
    },
    async push(entry) {
      const queueMessage = await queueChannel.send(
        `<@!${entry.senderId}> requested a song that's **${durationString(entry.seconds)}** long: ${
          entry.url
        }`,
        { allowedMentions: { users: [] } }
      );
      return queueStorage.create({ ...entry, queueMessageId: queueMessage.id, isDone: false });
    },
    pop() {
      // TODO: Strikethrough the message
      // TODO: Mark the entry as "used"
      // TODO: If no unused entries exist, return null
      return Promise.resolve(null);
    },
    getAllEntries() {
      return queueStorage.fetchAll();
    },
    getLatestEntryFrom(userId) {
      return queueStorage.fetchLatestFrom(userId);
    },
    clear() {
      return queueStorage.clear();
    }
  };
}
