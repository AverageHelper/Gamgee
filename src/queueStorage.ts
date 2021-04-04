import Discord from "discord.js";
import { UniqueConstraintError } from "sequelize";
import type { Transaction } from "sequelize";
import type { QueueConfig } from "./actions/database/schemas/queueConfigSchema";
import type { QueueEntrySchema } from "./actions/database/schemas/queueEntrySchema";
import { useDatabase, Database } from "./actions/database/useDatabase";
import { useLogger } from "./logger";
import {
  DEFAULT_ENTRY_DURATION,
  DEFAULT_SUBMISSION_COOLDOWN,
  DEFAULT_SUBMISSION_MAX_QUANTITY
} from "./constants/queues";
import richErrorMessage from "./helpers/richErrorMessage";

const logger = useLogger();

export interface QueueEntry {
  queueMessageId: string;
  url: string;
  seconds: number;
  sentAt: Date;
  senderId: string;
  isDone: boolean;
}
export type UnsentQueueEntry = Omit<QueueEntry, "queueMessageId" | "isDone">;

/**
 * Converts a `QueueEntrySchema` instance to a `QueueEntry`.
 * @param storedEntry Queue entry data from the database.
 * @returns A `QueueEntry` object.
 */
function toQueueEntry(storedEntry: QueueEntrySchema): QueueEntry {
  return {
    queueMessageId: storedEntry.queueMessageId,
    url: storedEntry.url,
    seconds: storedEntry.seconds,
    sentAt: storedEntry.sentAt,
    senderId: storedEntry.senderId,
    isDone: storedEntry.isDone
  };
}

export class DuplicateEntryTimeError extends Error {
  readonly entry: QueueEntry;

  constructor(entry: QueueEntry) {
    super("Duplicate entry. Try again.");
    this.name = "DuplicateEntryTimeError";
    this.entry = entry;
  }
}

export class QueueEntryManager {
  readonly db: Database;

  /** The channel for this queue. */
  private readonly queueChannel: Discord.TextChannel;

  constructor(queueChannel: Discord.TextChannel, db: Database) {
    this.db = db;
    this.queueChannel = queueChannel;
  }

  /** Retrieves the queue's configuration settings. */
  async getConfig(transaction?: Transaction): Promise<QueueConfig> {
    const config = await this.db.QueueConfigs.findOne({
      where: {
        channelId: this.queueChannel.id
      },
      transaction
    });
    return {
      entryDurationSeconds: config?.entryDurationSeconds ?? DEFAULT_ENTRY_DURATION,
      cooldownSeconds: config?.cooldownSeconds ?? DEFAULT_SUBMISSION_COOLDOWN,
      submissionMaxQuantity: config?.submissionMaxQuantity ?? DEFAULT_SUBMISSION_MAX_QUANTITY
    };
  }

  /** Updates the provided properties of a queue's configuration settings. */
  async updateConfig(config: Partial<QueueConfig>): Promise<void> {
    await this.db.proxy.transaction(async transaction => {
      const oldConfig = await this.getConfig(transaction);

      let entryDurationSeconds: number | null;
      if (config.entryDurationSeconds === undefined) {
        entryDurationSeconds = oldConfig.entryDurationSeconds;
      } else {
        entryDurationSeconds = config.entryDurationSeconds;
      }

      let cooldownSeconds: number | null;
      if (config.cooldownSeconds === undefined) {
        cooldownSeconds = oldConfig.cooldownSeconds;
      } else {
        cooldownSeconds = config.cooldownSeconds;
      }

      let submissionMaxQuantity: number | null;
      if (config.submissionMaxQuantity === undefined) {
        submissionMaxQuantity = oldConfig.submissionMaxQuantity;
      } else {
        submissionMaxQuantity = config.submissionMaxQuantity;
      }
      await this.db.QueueConfigs.upsert(
        {
          channelId: this.queueChannel.id,
          entryDurationSeconds,
          cooldownSeconds,
          submissionMaxQuantity
        },
        { transaction }
      );
    });
  }

  /** Adds the queue entry to the database. */
  async create(entry: QueueEntry): Promise<QueueEntry> {
    try {
      await this.db.proxy.transaction(async transaction => {
        // Make sure the guild and channels are in there
        await this.db.Guilds.findOrCreate({
          where: {
            id: this.queueChannel.guild.id,
            currentQueue: this.queueChannel.id
          },
          defaults: {
            id: this.queueChannel.guild.id,
            currentQueue: this.queueChannel.id,
            isQueueOpen: false
          },
          transaction
        });
        await this.db.Channels.upsert(
          {
            id: this.queueChannel.id,
            guildId: this.queueChannel.guild.id
          },
          { transaction }
        );

        // Make sure we have at least the default config
        await this.db.QueueConfigs.findOrCreate({
          where: {
            channelId: this.queueChannel.id
          },
          defaults: {
            channelId: this.queueChannel.id,
            entryDurationSeconds: DEFAULT_ENTRY_DURATION,
            cooldownSeconds: DEFAULT_SUBMISSION_COOLDOWN,
            submissionMaxQuantity: DEFAULT_SUBMISSION_MAX_QUANTITY
          },
          transaction
        });

        // Add the entry
        await this.db.QueueEntries.create(
          {
            queueMessageId: entry.queueMessageId,
            url: entry.url,
            seconds: entry.seconds,
            guildId: this.queueChannel.guild.id,
            channelId: this.queueChannel.id,
            senderId: entry.senderId,
            sentAt: entry.sentAt,
            isDone: entry.isDone
          },
          { transaction }
        );
      });
    } catch (error: unknown) {
      if (error instanceof UniqueConstraintError) {
        // Wait half a second, set the date to now, then try again.
        logger.error(richErrorMessage("Sequelize error:", error));
        throw new DuplicateEntryTimeError(entry);
      }
      throw error;
    }

    return entry;
  }

  /** Removes the queue entry from the database. */
  async remove(entry: QueueEntry): Promise<void> {
    await this.db.QueueEntries.destroy({
      where: {
        channelId: this.queueChannel.id,
        guildId: this.queueChannel.guild.id,
        queueMessageId: entry.queueMessageId
      }
    });
  }

  /** Fetches an entry with the given message ID. */
  async fetchEntryFromMessage(queueMessageId: string): Promise<QueueEntry | null> {
    return this.getEntryWithMsgId(queueMessageId);
  }

  /** Fetches all entries in queue order. */
  async fetchAll(): Promise<Array<QueueEntry>> {
    const entries = await this.db.QueueEntries.findAll({
      where: {
        channelId: this.queueChannel.id,
        guildId: this.queueChannel.guild.id
      },
      order: [["sentAt", "ASC"]]
    });
    return entries.map(toQueueEntry);
  }

  /** Fetches the number of entries in the queue. */
  async countAll(): Promise<number> {
    return this.db.QueueEntries.count({
      where: {
        channelId: this.queueChannel.id,
        guildId: this.queueChannel.guild.id
      }
    });
  }

  /** Fetches all entries by the given user in order of submission. */
  async fetchAllFrom(senderId: string): Promise<Array<QueueEntry>> {
    const entries = await this.db.QueueEntries.findAll({
      where: {
        channelId: this.queueChannel.id,
        guildId: this.queueChannel.guild.id,
        senderId
      },
      order: [["sentAt", "ASC"]]
    });
    return entries.map(toQueueEntry);
  }

  /** Fetches the lastest entry by the given user. */
  async fetchLatestFrom(senderId: string): Promise<QueueEntry | null> {
    const entry = await this.db.QueueEntries.findOne({
      where: {
        channelId: this.queueChannel.id,
        guildId: this.queueChannel.guild.id,
        senderId
      },
      order: [["sentAt", "DESC"]]
    });
    const result = entry ? toQueueEntry(entry) : null;
    logger.verbose(
      `Latest submission from user ${senderId}: ${JSON.stringify(result, undefined, 2)}`
    );
    return result;
  }

  /** Fetches the number of entries from the given user in the queue. */
  async countAllFrom(senderId: string): Promise<number> {
    return this.db.QueueEntries.count({
      where: {
        channelId: this.queueChannel.id,
        guildId: this.queueChannel.guild.id,
        senderId
      }
    });
  }

  /** Sets the entry's "done" value. */
  async markEntryDone(isDone: boolean, queueMessageId: string): Promise<void> {
    logger.debug(`Marking entry ${queueMessageId} as ${isDone ? "" : "not "}done`);
    await this.db.QueueEntries.update(
      { isDone },
      {
        where: {
          channelId: this.queueChannel.id,
          guildId: this.queueChannel.guild.id,
          queueMessageId
        }
      }
    );
  }

  /** Delete all entries for this queue channel. */
  async clear(): Promise<void> {
    await this.db.QueueEntries.destroy({
      where: {
        channelId: this.queueChannel.id,
        guildId: this.queueChannel.guild.id
      }
    });
  }

  private async getEntryWithMsgId(
    queueMessageId: string,
    transaction?: Transaction
  ): Promise<QueueEntry | null> {
    const doc = await this.db.QueueEntries.findOne({
      where: {
        channelId: this.queueChannel.id,
        guildId: this.queueChannel.guild.id,
        queueMessageId
      },
      transaction
    });
    return doc ? toQueueEntry(doc) : null;
  }
}

export async function useQueueStorage(
  queueChannel: Discord.TextChannel
): Promise<QueueEntryManager> {
  const db = await useDatabase();
  return new QueueEntryManager(queueChannel, db);
}
