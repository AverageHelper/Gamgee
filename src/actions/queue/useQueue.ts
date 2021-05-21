import type Discord from "discord.js";
import type { Logger } from "../../logger";
import type { MessageButton } from "../../DiscordInterface";
import type { QueueConfig } from "../../database/model/QueueConfig";
import type { QueueEntry, QueueEntryManager, UnsentQueueEntry } from "../../useQueueStorage";
import durationString from "../../helpers/durationString";
import StringBuilder from "../../helpers/StringBuilder";
import richErrorMessage from "../../helpers/richErrorMessage";
import { addStrikethrough, removeStrikethrough } from "./strikethroughText";
import { deleteMessage, editMessage, suppressEmbedsForMessage } from "../messages";
import { DiscordInterface } from "../../DiscordInterface";
import { useLogger } from "../../logger";
import { useQueueStorage } from "../../useQueueStorage";
import {
  REACTION_BTN_DONE,
  REACTION_BTN_UNDO,
  REACTION_BTN_DELETE
} from "../../constants/reactions";

/**
 * A proxy for queue management and feedback. These methods may modify the
 * queue and manage messages in the queue channel.
 */
export class QueueManager {
  private readonly queueStorage: QueueEntryManager;
  private readonly queueChannel: Discord.TextChannel;
  private readonly ui: DiscordInterface;
  private readonly logger: Logger;

  constructor(
    queueStorage: QueueEntryManager,
    queueChannel: Discord.TextChannel,
    logger: Logger = useLogger()
  ) {
    this.queueStorage = queueStorage;
    this.queueChannel = queueChannel;
    this.ui = new DiscordInterface(queueChannel.client);
    this.logger = logger;
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
    let entry: QueueEntry;
    try {
      entry = await this.queueStorage.create({
        ...newEntry,
        queueMessageId: queueMessage.id,
        isDone: false
      });

      // If the database write fails...
    } catch (error: unknown) {
      await deleteMessage(queueMessage);
      throw error;
    }

    // Add the buttons
    const newEntryButtons: NonEmptyArray<MessageButton> = [
      { emoji: REACTION_BTN_DONE }, //
      { emoji: REACTION_BTN_DELETE }
    ];

    this.ui.makeInteractive(queueMessage, newEntryButtons, async error => {
      this.logger.error(richErrorMessage("Failed to add reaction UI for a message.", error));
      await Promise.allSettled([
        this.queueStorage.removeEntryFromMessage(queueMessage.id),
        deleteMessage(queueMessage)
      ]);
      return false;
    });

    return entry;
  }

  /** Fetches an entry with the given message ID. */
  async getEntryFromMessage(queueMessageId: string): Promise<QueueEntry | null> {
    return this.queueStorage.fetchEntryFromMessage(queueMessageId);
  }

  /** If the message represents a "done" entry, that entry is unmarked. */
  async markNotDone(queueMessage: Discord.Message | Discord.PartialMessage): Promise<void> {
    const message = await queueMessage.fetch();
    await this.queueStorage.markEntryDone(false, queueMessage.id);

    await suppressEmbedsForMessage(message, false);
    await editMessage(queueMessage, removeStrikethrough(message.content));

    const entryButtons: NonEmptyArray<MessageButton> = [
      { emoji: REACTION_BTN_DONE }, //
      { emoji: REACTION_BTN_DELETE }
    ];
    this.ui.makeInteractive(message, entryButtons, error => {
      this.logger.error(richErrorMessage("Failed to add reaction UI for a message.", error));
    });
  }

  /** If the message represents a "not done" entry, that entry is marked "done". */
  async markDone(queueMessage: Discord.Message | Discord.PartialMessage): Promise<void> {
    const message = await queueMessage.fetch();
    await this.queueStorage.markEntryDone(true, queueMessage.id);

    await editMessage(queueMessage, addStrikethrough(message.content));
    await suppressEmbedsForMessage(message);

    const doneEntryButton: NonEmptyArray<MessageButton> = [{ emoji: REACTION_BTN_UNDO }];
    this.ui.makeInteractive(message, doneEntryButton, error => {
      this.logger.error(richErrorMessage("Failed to add reaction UI for a message.", error));
    });
  }

  /**
   * If the message represents a queue entry, that entry is removed and the message deleted.
   *
   * @returns the entry that was deleted.
   */
  async deleteEntryFromMessage(
    queueMessage: Discord.Message | Discord.PartialMessage
  ): Promise<QueueEntry | null> {
    const entry = await this.queueStorage.fetchEntryFromMessage(queueMessage.id);
    if (entry === null) return entry;

    await this.queueStorage.removeEntryFromMessage(queueMessage.id);
    await deleteMessage(queueMessage);

    return entry;
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
