import type Discord from "discord.js";
import type { QueueConfig } from "../../actions/database/schemas/queueConfigSchema";
import type { QueueEntry, UnsentQueueEntry } from "../../queueStorage";
import { useQueueStorage } from "../../queueStorage";
import { useLogger } from "../../logger";
import durationString from "../../helpers/durationString";
import { deleteMessage, editMessage } from "../messages";
import StringBuilder from "../../helpers/StringBuilder";
import {
  REACTION_BTN_DONE,
  REACTION_BTN_UNDO,
  REACTION_BTN_MUSIC
} from "../../constants/reactions";
import { addStrikethrough, removeStrikethrough } from "./strikethroughText";
import richErrorMessage from "../../helpers/richErrorMessage";

const logger = useLogger();

export type { QueueEntry, UnsentQueueEntry } from "../../queueStorage";

/**
 * A proxy for queue management and feedback. These methods may modify the
 * queue and manage messages in the queue channel.
 */
export interface QueueManager {
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
    async getConfig(): Promise<QueueConfig> {
      return queueStorage.getConfig();
    },

    async updateConfig(config): Promise<void> {
      return queueStorage.updateConfig(config);
    },

    async count(): Promise<number> {
      return queueStorage.countAll();
    },

    async countFrom(userId): Promise<number> {
      return queueStorage.countAllFrom(userId);
    },

    async playtimeRemaining(): Promise<number> {
      const queue = await queueStorage.fetchAll();
      let duration = 0;
      queue
        .filter(e => !e.isDone)
        .forEach(e => {
          duration += e.seconds;
        });
      return duration;
    },

    async playtimeTotal(): Promise<number> {
      const queue = await queueStorage.fetchAll();
      let duration = 0;
      queue.forEach(e => {
        duration += e.seconds;
      });
      return duration;
    },

    async push(newEntry): Promise<QueueEntry> {
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
        await deleteMessage(queueMessage, "We had an error");
        throw error;
      }
    },

    async getEntryFromMessage(queueMessageId): Promise<QueueEntry | null> {
      return queueStorage.fetchEntryFromMessage(queueMessageId);
    },

    async markNotDone(queueMessage): Promise<void> {
      await queueStorage.markEntryDone(false, queueMessage.id);
      await Promise.all([
        editMessage(queueMessage, removeStrikethrough(queueMessage.content)),
        queueMessage
          .suppressEmbeds(false)
          .catch(error => logger.error(richErrorMessage("Cannot suppress message embeds.", error))),
        queueMessage.reactions.resolve(REACTION_BTN_UNDO)?.remove()
      ]);
      if (!queueMessage.reactions.resolve(REACTION_BTN_MUSIC)) {
        await queueMessage.react(REACTION_BTN_MUSIC);
      }
      await queueMessage.react(REACTION_BTN_DONE);
    },

    async markDone(queueMessage): Promise<void> {
      await queueStorage.markEntryDone(true, queueMessage.id);
      await Promise.all([
        editMessage(queueMessage, addStrikethrough(queueMessage.content)),
        queueMessage
          .suppressEmbeds(true)
          .catch(error => logger.error(richErrorMessage("Cannot suppress message embeds.", error))),
        queueMessage.reactions.resolve(REACTION_BTN_DONE)?.remove()
      ]);
      if (!queueMessage.reactions.resolve(REACTION_BTN_MUSIC)) {
        await queueMessage.react(REACTION_BTN_MUSIC);
      }
      await queueMessage.react(REACTION_BTN_UNDO);
    },

    async getAllEntries(): Promise<Array<QueueEntry>> {
      return queueStorage.fetchAll();
    },

    async getLatestEntryFrom(userId): Promise<QueueEntry | null> {
      return queueStorage.fetchLatestFrom(userId);
    },

    async clear(): Promise<void> {
      return queueStorage.clear();
    }
  };
}
