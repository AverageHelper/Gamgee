import type Discord from "discord.js";
import type { QueueConfig } from "../../database/model/QueueConfig";
import type { QueueEntry, QueueEntryManager, UnsentQueueEntry } from "../../useQueueStorage";
import { useQueueStorage } from "../../useQueueStorage";
import { useLogger } from "../../logger";
import durationString from "../../helpers/durationString";
import { deleteMessage, editMessage } from "../messages";
import StringBuilder from "../../helpers/StringBuilder";
import {
  REACTION_BTN_DONE,
  REACTION_BTN_UNDO,
  REACTION_BTN_MUSIC,
  REACTION_BTN_DELETE
} from "../../constants/reactions";
import { addStrikethrough, removeStrikethrough } from "./strikethroughText";
import richErrorMessage from "../../helpers/richErrorMessage";

const logger = useLogger();

/**
 * A proxy for queue management and feedback. These methods may modify the
 * queue and manage messages in the queue channel.
 */
export class QueueManager {
  private readonly queueStorage: QueueEntryManager;
  private readonly queueChannel: Discord.TextChannel;

  constructor(queueStorage: QueueEntryManager, queueChannel: Discord.TextChannel) {
    this.queueStorage = queueStorage;
    this.queueChannel = queueChannel;
  }

  /** Retrieves the queue's configuration settings. */
  async getConfig(): Promise<QueueConfig> {
    return this.queueStorage.getConfig();
  }

  /** Updates the provided properties of a queue's configuration settings. */
  async updateConfig(config: Partial<QueueConfig>): Promise<void> {
    return this.queueStorage.updateConfig(config);
  }

  /** Retrieves the number of entries in the queue */
  async count(): Promise<number> {
    return this.queueStorage.countAll();
  }

  /** Retrieves the number of entries in the queue submitted by the given user. */
  async countFrom(userId: string): Promise<number> {
    return this.queueStorage.countAllFrom(userId);
  }

  /** Retrieves the playtime of the queue's unfinished entries. */
  async playtimeRemaining(): Promise<number> {
    const queue = await this.queueStorage.fetchAll();
    let duration = 0;
    queue
      .filter(e => !e.isDone)
      .forEach(e => {
        duration += e.seconds;
      });
    return duration;
  }

  /** Retrieves the total playtime of the queue's entries. */
  async playtimeTotal(): Promise<number> {
    const queue = await this.queueStorage.fetchAll();
    let duration = 0;
    queue.forEach(e => {
      duration += e.seconds;
    });
    return duration;
  }

  /** Adds an entry to the queue cache and sends the entry to the queue channel. */
  async push(newEntry: UnsentQueueEntry): Promise<QueueEntry> {
    const messageBuilder = new StringBuilder(`<@!${newEntry.senderId}>`);
    messageBuilder.push(" requested a song that's ");
    messageBuilder.pushBold(durationString(newEntry.seconds));
    messageBuilder.push(` long: ${newEntry.url}`);

    const queueMessage = await this.queueChannel.send(messageBuilder.result(), {
      allowedMentions: { users: [] }
    });
    try {
      const entry = await this.queueStorage.create({
        ...newEntry,
        queueMessageId: queueMessage.id,
        isDone: false
      });

      // Add the "Done" button
      await queueMessage.react(REACTION_BTN_MUSIC);
      await queueMessage.react(REACTION_BTN_DONE);
      await queueMessage.react(REACTION_BTN_DELETE);

      return entry;

      // If the database write fails...
    } catch (error: unknown) {
      await deleteMessage(queueMessage, "We had an error");
      throw error;
    }
  }

  /** Fetches an entry with the given message ID. */
  async getEntryFromMessage(queueMessageId: string): Promise<QueueEntry | null> {
    return this.queueStorage.fetchEntryFromMessage(queueMessageId);
  }

  /** If the message represents a "done" entry, that entry is unmarked. */
  async markNotDone(queueMessage: Discord.Message): Promise<void> {
    await this.queueStorage.markEntryDone(false, queueMessage.id);
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
    await queueMessage.react(REACTION_BTN_DELETE);
  }

  /** If the message represents a "not done" entry, that entry is marked "done". */
  async markDone(queueMessage: Discord.Message): Promise<void> {
    await this.queueStorage.markEntryDone(true, queueMessage.id);
    await Promise.all([
      editMessage(queueMessage, addStrikethrough(queueMessage.content)),
      queueMessage
        .suppressEmbeds(true)
        .catch(error => logger.error(richErrorMessage("Cannot suppress message embeds.", error))),
      Promise.all([
        queueMessage.reactions.resolve(REACTION_BTN_DELETE)?.remove(),
        queueMessage.reactions.resolve(REACTION_BTN_DONE)?.remove()
      ])
    ]);
    if (!queueMessage.reactions.resolve(REACTION_BTN_MUSIC)) {
      await queueMessage.react(REACTION_BTN_MUSIC);
    }
    await queueMessage.react(REACTION_BTN_UNDO);
  }

  /** If the message represents a queue entry, that entry is removed and the message deleted. */
  async deleteEntryFromMessage(queueMessage: Discord.Message): Promise<void> {
    const entry = await this.queueStorage.fetchEntryFromMessage(queueMessage.id);
    if (entry === null) return;

    await this.queueStorage.removeEntryFromMessage(queueMessage.id);
    await deleteMessage(queueMessage);
  }

  /** Returns all entries in the queue. */
  async getAllEntries(): Promise<Array<QueueEntry>> {
    return this.queueStorage.fetchAll();
  }

  /** Returns the latest entry from the user with the provided ID. */
  async getLatestEntryFrom(userId: string): Promise<QueueEntry | null> {
    return this.queueStorage.fetchLatestFrom(userId);
  }

  /** Resets the queue. Deletes all cached data about the queue. */
  async clear(): Promise<void> {
    return this.queueStorage.clear();
  }
}

/**
 * Sets up and returns an interface for the queue cache and long-term storage.
 *
 * @param queueChannel The channel for the current queue.
 * @returns If we don't have a queue cache stored for the given channel, a new
 *  one is created. We return that. Otherwise, we just return what we have stored
 *  or cached, whichever is handy.
 */
export function useQueue(queueChannel: Discord.TextChannel): QueueManager {
  const queueStorage = useQueueStorage(queueChannel);
  return new QueueManager(queueStorage, queueChannel);
}
