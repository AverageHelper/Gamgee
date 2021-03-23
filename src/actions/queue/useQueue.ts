import Discord from "discord.js";
import type { QueueConfig } from "../../actions/database/schemas/queueConfigSchema";
import { useQueueStorage, QueueEntry, UnsentQueueEntry } from "../../queueStorage";
import { useLogger } from "../../logger";
import durationString from "../../helpers/durationString";
import StringBuilder from "../../helpers/StringBuilder";
import {
  REACTION_BTN_DONE,
  REACTION_BTN_UNDO,
  REACTION_BTN_MUSIC
} from "../../constants/reactions";
import { addStrikethrough, removeStrikethrough } from "./strikethroughText";

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

  /** Retrieves the number of entries in the queue submitted by the given user. */
  countFrom: (userId: string) => Promise<number>;

  /** Retrieves the playtime of the queue's unfinished entries. */
  playtimeRemaining: () => Promise<number>;

  /** Retrieves the total playtime of the queue's entries. */
  playtimeTotal: () => Promise<number>;

  /** Adds an entry to the queue cache and sends the entry to the queue channel. */
  push: (entry: UnsentQueueEntry) => Promise<QueueEntry>;

  /** Fetches an entry with the given message ID. */
  getEntryFromMessage: (queueMessageId: string) => Promise<QueueEntry | null>;

  /** If the message represents a "done" entry, that entry is unmarked. */
  markNotDone: (queueMessage: Discord.Message) => Promise<void>;

  /** If the message represents a "not done" entry, that entry is marked "done". */
  markDone: (queueMessage: Discord.Message) => Promise<void>;

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
    countFrom(userId) {
      return queueStorage.countAllFrom(userId);
    },
    async playtimeRemaining() {
      const queue = await queueStorage.fetchAll();
      let duration = 0;
      queue
        .filter(e => !e.isDone)
        .forEach(e => {
          duration += e.seconds;
        });
      return duration;
    },
    async playtimeTotal() {
      const queue = await queueStorage.fetchAll();
      let duration = 0;
      queue.forEach(e => {
        duration += e.seconds;
      });
      return duration;
    },
    async push(newEntry) {
      const messageBuilder = new StringBuilder(`<@!${newEntry.senderId}>`);
      messageBuilder.push(" requested a song that's ");
      messageBuilder.pushBold(durationString(newEntry.seconds));
      messageBuilder.push(` long: ${newEntry.url}`);

      const queueMessage = await queueChannel.send(messageBuilder.result(), {
        allowedMentions: { users: [] }
      });
      try {
        const entry = await queueStorage.create({
          ...newEntry,
          queueMessageId: queueMessage.id,
          isDone: false
        });

        // Add the "Done" button
        await queueMessage.react(REACTION_BTN_MUSIC);
        await queueMessage.react(REACTION_BTN_DONE);

        return entry;

        // If the database write fails...
      } catch (error: unknown) {
        await queueMessage.delete();
        throw error;
      }
    },
    getEntryFromMessage(queueMessageId) {
      return queueStorage.fetchEntryFromMessage(queueMessageId);
    },
    async markNotDone(queueMessage: Discord.Message) {
      await queueStorage.markEntryDone(false, queueMessage.id);
      await Promise.all([
        queueMessage.edit(removeStrikethrough(queueMessage.content)),
        queueMessage.suppressEmbeds(false)
      ]);
      // await queueMessage.reactions.removeAll();
      await queueMessage.reactions.resolve(REACTION_BTN_UNDO)?.remove();
      await queueMessage.react(REACTION_BTN_MUSIC);
      await queueMessage.react(REACTION_BTN_DONE);
    },
    async markDone(queueMessage: Discord.Message) {
      await queueStorage.markEntryDone(true, queueMessage.id);
      await Promise.all([
        queueMessage.edit(addStrikethrough(queueMessage.content)),
        queueMessage.suppressEmbeds(true)
      ]);
      await queueMessage.reactions.resolve(REACTION_BTN_DONE)?.remove();
      await queueMessage.react(REACTION_BTN_MUSIC);
      await queueMessage.react(REACTION_BTN_UNDO);
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
